import React, { useState, useEffect } from 'react';
import { User } from '../types/roleTypes';
import { Icons } from '../constants';
import { PatientProfile, Appointment, ProvisionalDiagnosisResult, ChatMessage, Prescription, DoctorNoteSuggestion } from '../types';
import { generateDoctorNotes, generatePrescriptionWithEducation, generateDoctorNoteSuggestions } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface DoctorDashboardProps {
  user: User;
  onLogout: () => void;
}

interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  symptoms: string;
  appointmentTime: Date;
  status: 'scheduled' | 'in_progress' | 'completed';
  urgency: 'routine' | 'urgent' | 'emergency';
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'clinical_tools' | 'prescriptions' | 'analytics'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<PatientCase | null>(null);
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [noteSuggestions, setNoteSuggestions] = useState<DoctorNoteSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Clinical Workflow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<Array<{
    diagnosis: string;
    confidence: number;
    reasoning: string;
    selected: boolean;
  }>>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    selected: boolean;
  }>>([]);
  const [patientHistory, setPatientHistory] = useState<{
    demographics: { name: string; age: number; gender: string; };
    previousVisits: Array<{ date: string; diagnosis: string; treatment: string; }>;
    medicalConditions: string[];
    currentMedications: string[];
    allergies: string[];
    vitalSigns: { bp: string; hr: string; temp: string; weight: string; };
  }>({
    demographics: { name: '', age: 0, gender: '' },
    previousVisits: [],
    medicalConditions: [],
    currentMedications: [],
    allergies: [],
    vitalSigns: { bp: '', hr: '', temp: '', weight: '' }
  });
  const [isGeneratingDifferentials, setIsGeneratingDifferentials] = useState(false);
  const [isGeneratingTreatment, setIsGeneratingTreatment] = useState(false);

  // Sample patient cases for demonstration
  const [patientCases] = useState<PatientCase[]>([
    {
      id: '1',
      patientName: 'John Smith',
      age: 45,
      symptoms: 'Chest pain, shortness of breath, fatigue for 3 days',
      appointmentTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      status: 'scheduled',
      urgency: 'urgent'
    },
    {
      id: '2', 
      patientName: 'Maria Garcia',
      age: 32,
      symptoms: 'Persistent cough, fever, body aches for 5 days',
      appointmentTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      status: 'scheduled',
      urgency: 'routine'
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      age: 67,
      symptoms: 'Severe abdominal pain, nausea, vomiting',
      appointmentTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      status: 'in_progress',
      urgency: 'emergency'
    }
  ]);

  // Fallback clinical note templates
  const generateFallbackNotes = (patient: PatientCase): string => {
    const urgencyNote = patient.urgency === 'emergency' ? 'URGENT - ' : patient.urgency === 'urgent' ? 'Priority - ' : '';

    return `${urgencyNote}Clinical Assessment for ${patient.patientName}

CHIEF COMPLAINT:
${patient.symptoms}

PATIENT INFORMATION:
- Age: ${patient.age} years
- Appointment: ${patient.appointmentTime.toLocaleString()}
- Status: ${patient.status.replace('_', ' ')}

CLINICAL NOTES:
- Patient presents with: ${patient.symptoms}
- Duration and onset: [To be documented during examination]
- Associated symptoms: [To be assessed]
- Pain scale (if applicable): [1-10 scale]
- Vital signs: [To be recorded]

ASSESSMENT:
- Initial impression: [Based on presenting symptoms]
- Differential diagnosis considerations:
  * Primary consideration: [Most likely diagnosis]
  * Alternative considerations: [Other possibilities]

PLAN:
- Further evaluation needed: [Specify tests/examinations]
- Treatment recommendations: [Initial management]
- Follow-up instructions: [Patient guidance]
- Red flag symptoms to watch for: [Warning signs]

NEXT STEPS:
- [ ] Complete physical examination
- [ ] Review medical history
- [ ] Order appropriate tests if indicated
- [ ] Discuss treatment options with patient
- [ ] Schedule follow-up as needed

Notes generated at: ${new Date().toLocaleString()}`;
  };

  const handleGenerateNotes = async (patient: PatientCase) => {
    setIsGeneratingNotes(true);
    try {
      const patientProfile: PatientProfile = {
        name: patient.patientName,
        age: patient.age,
        gender: 'Unknown',
        medicalHistory: [],
        currentMedications: [],
        allergies: []
      };

      const notes = await generateDoctorNotes(
        patient.symptoms,
        'Initial Assessment Required',
        patientProfile
      );

      // Check if API call failed and use fallback
      if (!notes || notes.includes('Error:') || notes.includes('Could not generate')) {
        console.log('API failed, using fallback clinical notes template');
        setDoctorNotes(generateFallbackNotes(patient));
        setShowSuggestions(true);
        await loadNoteSuggestions(patient);
      } else {
        setDoctorNotes(notes);
        setShowSuggestions(true);
        await loadNoteSuggestions(patient);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      setDoctorNotes(generateFallbackNotes(patient));
      setShowSuggestions(true);
      await loadNoteSuggestions(patient);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const loadNoteSuggestions = async (patient: PatientCase) => {
    setIsLoadingSuggestions(true);
    try {
      const patientProfile: PatientProfile = {
        name: patient.patientName,
        age: patient.age,
        gender: 'Unknown',
        medicalHistory: [],
        currentMedications: [],
        allergies: []
      };

      const suggestions = await generateDoctorNoteSuggestions(
        doctorNotes,
        'Initial Assessment Required',
        patientProfile
      );

      if (suggestions && suggestions.length > 0) {
        setNoteSuggestions(suggestions);
      } else {
        // Fallback suggestions based on symptoms
        setNoteSuggestions(generateFallbackSuggestions(patient));
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setNoteSuggestions(generateFallbackSuggestions(patient));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const generateFallbackSuggestions = (patient: PatientCase): DoctorNoteSuggestion[] => {
    const suggestions: DoctorNoteSuggestion[] = [];

    // Add symptom-specific suggestions
    if (patient.symptoms.toLowerCase().includes('chest pain')) {
      suggestions.push(
        { suggestion: 'Assess for cardiac risk factors (hypertension, diabetes, smoking history)', type: 'meta-finding' },
        { suggestion: 'Consider ECG and cardiac enzymes if indicated', type: 'autocomplete' }
      );
    }

    if (patient.symptoms.toLowerCase().includes('cough')) {
      suggestions.push(
        { suggestion: 'Evaluate for respiratory symptoms: dyspnea, wheezing, sputum production', type: 'meta-finding' },
        { suggestion: 'Consider chest X-ray if persistent or concerning features', type: 'autocomplete' }
      );
    }

    if (patient.symptoms.toLowerCase().includes('fever')) {
      suggestions.push(
        { suggestion: 'Document fever pattern, associated chills, and response to antipyretics', type: 'meta-finding' },
        { suggestion: 'Consider infectious workup including CBC with differential', type: 'autocomplete' }
      );
    }

    // Add general suggestions
    suggestions.push(
      { suggestion: 'Review current medications and allergies', type: 'meta-finding' },
      { suggestion: 'Document social history including smoking, alcohol, and drug use', type: 'autocomplete' }
    );

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const applySuggestion = (suggestion: DoctorNoteSuggestion) => {
    if (showSOAPEditor) {
      // Apply to active SOAP section
      setSOAPNotes(prev => {
        const sectionKey = {
          'S': 'subjective',
          'O': 'objective',
          'A': 'assessment',
          'P': 'plan'
        }[activeSOAPSection] as keyof typeof prev;

        return {
          ...prev,
          [sectionKey]: prev[sectionKey] + (prev[sectionKey] ? '\n\n' : '') + suggestion.suggestion
        };
      });
    } else {
      // Apply to regular notes
      setDoctorNotes(prev => {
        if (suggestion.type === 'autocomplete') {
          return prev + '\n\n' + suggestion.suggestion;
        } else {
          return prev + '\n\nADDITIONAL CONSIDERATIONS:\n- ' + suggestion.suggestion;
        }
      });
    }
  };

  const generateSOAPSuggestions = (section: 'S' | 'O' | 'A' | 'P', patient: PatientCase): DoctorNoteSuggestion[] => {
    const suggestions: DoctorNoteSuggestion[] = [];

    switch (section) {
      case 'S': // Subjective
        suggestions.push(
          { suggestion: `Chief complaint: ${patient.symptoms}`, type: 'autocomplete' },
          { suggestion: 'History of present illness: Onset, location, duration, character, aggravating/alleviating factors, radiation, timing, severity', type: 'meta-finding' },
          { suggestion: 'Review of systems: Constitutional, cardiovascular, respiratory, gastrointestinal, genitourinary, musculoskeletal, neurological', type: 'meta-finding' },
          { suggestion: 'Past medical history, medications, allergies, social history, family history', type: 'autocomplete' }
        );
        break;

      case 'O': // Objective
        suggestions.push(
          { suggestion: 'Vital signs: BP, HR, RR, Temp, O2 sat, pain scale', type: 'autocomplete' },
          { suggestion: 'Physical examination: General appearance, HEENT, cardiovascular, pulmonary, abdominal, extremities, neurological', type: 'meta-finding' },
          { suggestion: 'Laboratory results and diagnostic studies', type: 'autocomplete' },
          { suggestion: 'Mental status examination if indicated', type: 'meta-finding' }
        );
        break;

      case 'A': // Assessment
        if (patient.symptoms.toLowerCase().includes('chest pain')) {
          suggestions.push(
            { suggestion: 'Chest pain - consider cardiac, pulmonary, GI, musculoskeletal etiologies', type: 'autocomplete' },
            { suggestion: 'Rule out acute coronary syndrome, pulmonary embolism, aortic dissection', type: 'meta-finding' }
          );
        }
        suggestions.push(
          { suggestion: 'Primary diagnosis based on clinical presentation', type: 'autocomplete' },
          { suggestion: 'Differential diagnoses to consider', type: 'meta-finding' },
          { suggestion: 'Clinical reasoning and risk stratification', type: 'autocomplete' }
        );
        break;

      case 'P': // Plan
        suggestions.push(
          { suggestion: 'Diagnostic studies: Labs, imaging, procedures as indicated', type: 'autocomplete' },
          { suggestion: 'Therapeutic interventions: Medications, procedures, referrals', type: 'autocomplete' },
          { suggestion: 'Patient education and counseling', type: 'meta-finding' },
          { suggestion: 'Follow-up instructions and return precautions', type: 'meta-finding' },
          { suggestion: 'Disposition: Discharge home, admit, transfer, etc.', type: 'autocomplete' }
        );
        break;
    }

    return suggestions.slice(0, 4);
  };

  const initializeSOAPNotes = (patient: PatientCase) => {
    setSOAPNotes({
      subjective: `Chief Complaint: ${patient.symptoms}\n\nHistory of Present Illness:\n[Document onset, duration, quality, severity, associated symptoms]\n\nReview of Systems:\n[Systematic review by organ system]\n\nPast Medical History:\n[Relevant medical conditions]\n\nMedications:\n[Current medications and dosages]\n\nAllergies:\n[Drug and environmental allergies]\n\nSocial History:\n[Smoking, alcohol, drugs, occupation]\n\nFamily History:\n[Relevant family medical history]`,

      objective: `Vital Signs:\n- Blood Pressure: ___\n- Heart Rate: ___\n- Respiratory Rate: ___\n- Temperature: ___\n- Oxygen Saturation: ___\n- Pain Scale: ___/10\n\nPhysical Examination:\n- General: [Appearance, distress level]\n- HEENT: [Head, eyes, ears, nose, throat]\n- Cardiovascular: [Heart sounds, murmurs, peripheral pulses]\n- Pulmonary: [Breath sounds, respiratory effort]\n- Abdominal: [Inspection, palpation, bowel sounds]\n- Extremities: [Edema, pulses, range of motion]\n- Neurological: [Mental status, cranial nerves, motor, sensory]\n\nDiagnostic Studies:\n[Lab results, imaging findings, other studies]`,

      assessment: `Primary Diagnosis:\n[Most likely diagnosis based on clinical presentation]\n\nDifferential Diagnoses:\n1. [Alternative diagnosis 1]\n2. [Alternative diagnosis 2]\n3. [Alternative diagnosis 3]\n\nClinical Reasoning:\n[Rationale for primary diagnosis and rule-outs]\n\nRisk Stratification:\n[Assessment of severity and prognosis]`,

      plan: `Diagnostic Plan:\n- [Additional tests or studies needed]\n- [Consultations required]\n\nTherapeutic Plan:\n- Medications: [Drug, dose, frequency, duration]\n- Procedures: [Any interventions needed]\n- Non-pharmacologic: [Lifestyle modifications, therapy]\n\nMonitoring:\n- [Parameters to follow]\n- [Frequency of monitoring]\n\nPatient Education:\n- [Key teaching points]\n- [Warning signs to watch for]\n\nFollow-up:\n- [When to return]\n- [Specific instructions]\n- [Referrals needed]\n\nDisposition:\n- [Discharge home/admit/transfer]\n- [Level of care needed]`
    });

    setShowSOAPEditor(true);
    setActiveSOAPSection('S');
    loadSOAPSuggestions('S', patient);
  };

  const loadSOAPSuggestions = (section: 'S' | 'O' | 'A' | 'P', patient: PatientCase) => {
    const suggestions = generateSOAPSuggestions(section, patient);
    setNoteSuggestions(suggestions);
    setShowSuggestions(true);
  };

  const generatePatientHistory = (patient: PatientCase) => {
    // Simulate patient history
    const history = [
      `Previous visit (3 months ago): Annual physical examination - Normal findings`,
      `Previous visit (6 months ago): Upper respiratory infection - Resolved with supportive care`,
      `Previous visit (1 year ago): Hypertension follow-up - Well controlled on current medications`,
      `Allergies: NKDA (No Known Drug Allergies)`,
      `Current Medications: [To be reviewed with patient]`,
      `Emergency Contacts: [To be updated]`
    ];
    setPatientHistory(history);
  };

  // Load comprehensive patient history for clinical workflow
  const loadComprehensivePatientHistory = (patient: PatientCase) => {
    const comprehensiveHistory = {
      demographics: {
        name: patient.patientName,
        age: patient.age,
        gender: 'Male' // This would come from patient data
      },
      previousVisits: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          diagnosis: 'Routine Annual Physical',
          treatment: 'Preventive care counseling, lab orders'
        },
        {
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          diagnosis: 'Hypertension Follow-up',
          treatment: 'Medication adjustment, lifestyle counseling'
        }
      ],
      medicalConditions: ['Hypertension (controlled)', 'Type 2 Diabetes (well-managed)', 'Hyperlipidemia'],
      currentMedications: [
        'Metformin 500mg BID',
        'Lisinopril 10mg daily',
        'Atorvastatin 20mg daily',
        'Aspirin 81mg daily'
      ],
      allergies: ['Penicillin (rash)', 'Sulfa drugs (GI upset)'],
      vitalSigns: {
        bp: '128/82 mmHg',
        hr: '72 bpm',
        temp: '98.6°F',
        weight: '165 lbs'
      }
    };
    setPatientHistory(comprehensiveHistory);
  };

  // Generate AI differential diagnoses based on clinical notes
  const generateDifferentialDiagnoses = async () => {
    if (!clinicalNotes.trim()) return;

    setIsGeneratingDifferentials(true);
    try {
      // Simulate AI-generated differential diagnoses based on symptoms
      const symptomBasedDifferentials = selectedPatient?.symptoms.toLowerCase().includes('chest pain') ? [
        {
          diagnosis: 'Acute Coronary Syndrome',
          confidence: 75,
          reasoning: 'Chest pain with associated symptoms warrants immediate cardiac evaluation. Risk factors and presentation pattern support this consideration.',
          selected: false
        },
        {
          diagnosis: 'Gastroesophageal Reflux Disease',
          confidence: 60,
          reasoning: 'Chest discomfort can be related to acid reflux, especially if associated with meals or lying down.',
          selected: false
        },
        {
          diagnosis: 'Musculoskeletal Chest Pain',
          confidence: 45,
          reasoning: 'Chest wall pain from muscle strain or costochondritis, particularly if pain is reproducible with movement.',
          selected: false
        }
      ] : [
        {
          diagnosis: 'Viral Upper Respiratory Infection',
          confidence: 85,
          reasoning: 'Symptoms consistent with viral etiology: gradual onset, low-grade fever, rhinorrhea, and cough without purulent sputum.',
          selected: false
        },
        {
          diagnosis: 'Acute Bronchitis',
          confidence: 70,
          reasoning: 'Persistent cough with clear sputum production, chest discomfort, and recent viral prodrome support this diagnosis.',
          selected: false
        },
        {
          diagnosis: 'Allergic Rhinitis',
          confidence: 45,
          reasoning: 'Seasonal pattern and clear nasal discharge could indicate allergic component, though fever makes this less likely.',
          selected: false
        }
      ];

      setDifferentialDiagnoses(symptomBasedDifferentials);
    } catch (error) {
      console.error('Error generating differentials:', error);
    } finally {
      setIsGeneratingDifferentials(false);
    }
  };

  // Generate AI treatment recommendations based on selected diagnosis
  const generateTreatmentPlan = async () => {
    if (!selectedDiagnosis) return;

    setIsGeneratingTreatment(true);
    try {
      // Simulate AI-generated treatment plan based on diagnosis
      const diagnosisBasedTreatment = selectedDiagnosis.toLowerCase().includes('coronary') ? [
        {
          medication: 'Aspirin',
          dosage: '81mg',
          frequency: 'Daily',
          duration: 'Ongoing',
          instructions: 'Take with food. For cardioprotection.',
          selected: true
        },
        {
          medication: 'Atorvastatin',
          dosage: '40mg',
          frequency: 'Daily at bedtime',
          duration: 'Ongoing',
          instructions: 'Monitor liver function. Avoid grapefruit.',
          selected: true
        },
        {
          medication: 'Metoprolol',
          dosage: '25mg',
          frequency: 'Twice daily',
          duration: 'Ongoing',
          instructions: 'Monitor heart rate and blood pressure.',
          selected: false
        }
      ] : [
        {
          medication: 'Acetaminophen',
          dosage: '650mg',
          frequency: 'Every 6 hours',
          duration: '5-7 days',
          instructions: 'Take with food. Do not exceed 3000mg daily.',
          selected: true
        },
        {
          medication: 'Dextromethorphan',
          dosage: '15mg',
          frequency: 'Every 4 hours',
          duration: '7-10 days',
          instructions: 'For cough suppression. Take as needed.',
          selected: true
        },
        {
          medication: 'Guaifenesin',
          dosage: '400mg',
          frequency: 'Every 4 hours',
          duration: '7-10 days',
          instructions: 'Expectorant. Increase fluid intake.',
          selected: false
        }
      ];

      setTreatmentPlan(diagnosisBasedTreatment);
    } catch (error) {
      console.error('Error generating treatment plan:', error);
    } finally {
      setIsGeneratingTreatment(false);
    }
  };

  const handleGeneratePrescription = async () => {
    if (!selectedPatient || !doctorNotes.trim()) {
      alert('Please select a patient and generate notes first.');
      return;
    }

    setIsGeneratingPrescription(true);
    try {
      const generatedPrescription = await generatePrescriptionWithEducation(
        'Clinical Assessment Required',
        doctorNotes,
        user.name,
        user.organizationName,
        'Medical License #12345'
      );
      
      setPrescription(generatedPrescription);
    } catch (error) {
      console.error('Error generating prescription:', error);
      alert('Error generating prescription. Please try again.');
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clinical Dashboard</h1>
                <p className="text-sm text-gray-600">{user.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Icons.LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Icons.BarChart },
              { id: 'patients', label: 'Patient Cases', icon: Icons.Users },
              { id: 'clinical_tools', label: 'Clinical Tools', icon: Icons.Stethoscope },
              { id: 'prescriptions', label: 'Prescriptions', icon: Icons.FileText },
              { id: 'analytics', label: 'Analytics', icon: Icons.TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{patientCases.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {patientCases.filter(p => p.status !== 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Urgent Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {patientCases.filter(p => p.urgency === 'urgent' || p.urgency === 'emergency').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Patient Cases</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {patientCases.slice(0, 3).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{patient.patientName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(patient.urgency)}`}>
                            {patient.urgency}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            {patient.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{patient.symptoms}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {patient.appointmentTime.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveTab('clinical_tools');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        Review Case
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Patient Cases</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {patientCases.map((patient) => (
                  <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{patient.patientName}</h3>
                          <span className="text-sm text-gray-500">Age: {patient.age}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(patient.urgency)}`}>
                            {patient.urgency}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            {patient.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2"><strong>Symptoms:</strong> {patient.symptoms}</p>
                        <p className="text-xs text-gray-500">
                          <strong>Appointment:</strong> {patient.appointmentTime.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setActiveTab('clinical_tools');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Open Case
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clinical_tools' && (
          <div className="space-y-6">
            {selectedPatient ? (
              <>
                {/* Clinical Workflow Header with Progress */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">Clinical Workflow: {selectedPatient.patientName}</h2>
                      <p className="text-blue-700">Age: {selectedPatient.age} | Chief Complaint: {selectedPatient.symptoms}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setCurrentStep(1);
                        setClinicalNotes('');
                        setDifferentialDiagnoses([]);
                        setSelectedDiagnosis('');
                        setTreatmentPlan([]);
                      }}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md transition-colors border"
                    >
                      Exit Workflow
                    </button>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center justify-between">
                    {[
                      { step: 1, label: 'History Review', icon: Icons.Clock },
                      { step: 2, label: 'Clinical Notes', icon: Icons.FileText },
                      { step: 3, label: 'Diagnosis', icon: Icons.Search },
                      { step: 4, label: 'Treatment', icon: Icons.Pill },
                      { step: 5, label: 'Prescription', icon: Icons.CheckCircle }
                    ].map(({ step, label, icon: Icon }, index) => (
                      <div key={step} className="flex items-center">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                          currentStep >= step
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          {currentStep > step ? (
                            <Icons.CheckCircle className="h-6 w-6" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-bold ${
                            currentStep >= step ? 'text-blue-900' : 'text-gray-500'
                          }`}>
                            Step {step}
                          </div>
                          <div className={`text-xs ${
                            currentStep >= step ? 'text-blue-700' : 'text-gray-400'
                          }`}>
                            {label}
                          </div>
                        </div>
                        {index < 4 && (
                          <div className={`w-16 h-1 mx-4 rounded ${
                            currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Clinical Workflow */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                        <Icons.Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Step 1: Patient History Review</h3>
                        <p className="text-gray-600">Review comprehensive patient information before clinical assessment</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Patient Demographics & Vital Signs */}
                      <div className="space-y-6">
                        <div className="bg-blue-50 rounded-lg p-6">
                          <h4 className="font-semibold text-blue-900 mb-4">Patient Demographics</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Name:</span>
                              <span className="font-medium text-blue-900">{patientHistory.demographics.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Age:</span>
                              <span className="font-medium text-blue-900">{patientHistory.demographics.age} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Gender:</span>
                              <span className="font-medium text-blue-900">{patientHistory.demographics.gender}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6">
                          <h4 className="font-semibold text-green-900 mb-4">Current Vital Signs</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-900">{patientHistory.vitalSigns.bp}</div>
                              <div className="text-sm text-green-700">Blood Pressure</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-900">{patientHistory.vitalSigns.hr}</div>
                              <div className="text-sm text-green-700">Heart Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-900">{patientHistory.vitalSigns.temp}</div>
                              <div className="text-sm text-green-700">Temperature</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-900">{patientHistory.vitalSigns.weight}</div>
                              <div className="text-sm text-green-700">Weight</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medical History & Medications */}
                      <div className="space-y-6">
                        <div className="bg-orange-50 rounded-lg p-6">
                          <h4 className="font-semibold text-orange-900 mb-4">Medical Conditions</h4>
                          <div className="space-y-2">
                            {patientHistory.medicalConditions.map((condition, index) => (
                              <div key={index} className="flex items-center">
                                <Icons.AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                                <span className="text-orange-800">{condition}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6">
                          <h4 className="font-semibold text-purple-900 mb-4">Current Medications</h4>
                          <div className="space-y-2">
                            {patientHistory.currentMedications.map((medication, index) => (
                              <div key={index} className="flex items-center">
                                <Icons.Pill className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-purple-800">{medication}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-6">
                          <h4 className="font-semibold text-red-900 mb-4">Allergies</h4>
                          <div className="space-y-2">
                            {patientHistory.allergies.map((allergy, index) => (
                              <div key={index} className="flex items-center">
                                <Icons.AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                <span className="text-red-800">{allergy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center text-lg font-medium"
                      >
                        Proceed to Clinical Documentation
                        <Icons.ArrowRight className="h-5 w-5 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Clinical Documentation */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                        <Icons.FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Step 2: Clinical Documentation</h3>
                        <p className="text-gray-600">Document patient encounter with AI assistance</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chief Complaint */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3">Chief Complaint</h4>
                        <p className="text-blue-800 bg-white p-3 rounded border">{selectedPatient.symptoms}</p>
                      </div>

                      {/* AI Suggestions */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-3">AI Suggestions</h4>
                        <div className="space-y-2">
                          <div className="bg-white p-2 rounded text-sm text-purple-800">
                            💡 Consider asking about onset and duration
                          </div>
                          <div className="bg-white p-2 rounded text-sm text-purple-800">
                            💡 Assess pain scale (1-10) if applicable
                          </div>
                          <div className="bg-white p-2 rounded text-sm text-purple-800">
                            💡 Review associated symptoms
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <button className="w-full bg-white hover:bg-gray-50 text-green-800 p-2 rounded text-sm border">
                            Add HPI Template
                          </button>
                          <button className="w-full bg-white hover:bg-gray-50 text-green-800 p-2 rounded text-sm border">
                            Add ROS Template
                          </button>
                          <button className="w-full bg-white hover:bg-gray-50 text-green-800 p-2 rounded text-sm border">
                            Add PE Template
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Large Clinical Notes Area */}
                    <div className="mt-6">
                      <label className="block text-lg font-semibold text-gray-900 mb-3">Clinical Documentation</label>
                      <textarea
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        className="w-full h-80 px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 text-base leading-relaxed resize-none"
                        placeholder="Document your clinical assessment here...

History of Present Illness:
- Onset:
- Duration:
- Character:
- Associated symptoms:
- Aggravating/alleviating factors:

Physical Examination:
- General appearance:
- Vital signs:
- System-specific findings:

Clinical Impression:
- Working diagnosis:
- Differential considerations: "
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
                      />
                      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                        <span>💡 Use AI suggestions above to enhance your documentation</span>
                        <span>{clinicalNotes.length} characters</span>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                      >
                        <Icons.ArrowLeft className="h-5 w-5 mr-2" />
                        Back to History
                      </button>
                      <button
                        onClick={() => {
                          generateDifferentialDiagnoses();
                          setCurrentStep(3);
                        }}
                        disabled={!clinicalNotes.trim() || isGeneratingDifferentials}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 text-lg font-medium"
                      >
                        {isGeneratingDifferentials ? (
                          <LoadingSpinner size="sm" text="Generating..." />
                        ) : (
                          <>
                            Generate AI Differential Diagnosis
                            <Icons.ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Differential Diagnosis Selection */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                        <Icons.Search className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Step 3: AI-Generated Differential Diagnosis</h3>
                        <p className="text-gray-600">Review AI-suggested diagnoses and select the most appropriate</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {differentialDiagnoses.map((diagnosis, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                            selectedDiagnosis === diagnosis.diagnosis
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                          }`}
                          onClick={() => setSelectedDiagnosis(diagnosis.diagnosis)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                                selectedDiagnosis === diagnosis.diagnosis
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedDiagnosis === diagnosis.diagnosis && (
                                  <Icons.CheckCircle className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900">{diagnosis.diagnosis}</h4>
                            </div>
                            <div className="flex items-center">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                diagnosis.confidence >= 70 ? 'bg-green-100 text-green-800' :
                                diagnosis.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {diagnosis.confidence}% confidence
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{diagnosis.reasoning}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                      >
                        <Icons.ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Documentation
                      </button>
                      <button
                        onClick={() => {
                          generateTreatmentPlan();
                          setCurrentStep(4);
                        }}
                        disabled={!selectedDiagnosis || isGeneratingTreatment}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 text-lg font-medium"
                      >
                        {isGeneratingTreatment ? (
                          <LoadingSpinner size="sm" text="Generating..." />
                        ) : (
                          <>
                            Generate Treatment Plan
                            <Icons.ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Clinical Note Suggestions */}
                {showSuggestions && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Clinical Note Suggestions</h3>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Icons.X className="h-5 w-5" />
                      </button>
                    </div>

                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" text="Loading suggestions..." />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {noteSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  suggestion.type === 'autocomplete'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {suggestion.type === 'autocomplete' ? 'Complete' : 'Consider'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                            </div>
                            <button
                              onClick={() => applySuggestion(suggestion)}
                              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        ))}

                        {noteSuggestions.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <Icons.Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No suggestions available at this time.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Treatment Plan & Medication Selection */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                        <Icons.Pill className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Step 4: AI-Assisted Treatment Plan</h3>
                        <p className="text-gray-600">Review and customize evidence-based treatment recommendations</p>
                      </div>
                    </div>

                    <div className="mb-6 bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Selected Diagnosis</h4>
                      <p className="text-purple-800 text-lg">{selectedDiagnosis}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Recommended Medications</h4>
                      {treatmentPlan.map((treatment, index) => (
                        <div
                          key={index}
                          className={`border-2 rounded-lg p-6 transition-all ${
                            treatment.selected
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={treatment.selected}
                                onChange={(e) => {
                                  const updatedPlan = [...treatmentPlan];
                                  updatedPlan[index].selected = e.target.checked;
                                  setTreatmentPlan(updatedPlan);
                                }}
                                className="w-5 h-5 text-purple-600 rounded mr-4"
                              />
                              <h5 className="text-lg font-semibold text-gray-900">{treatment.medication}</h5>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                {treatment.dosage}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {treatment.frequency}
                              </span>
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {treatment.duration}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white p-3 rounded border">{treatment.instructions}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                      >
                        <Icons.ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Diagnosis
                      </button>
                      <button
                        onClick={() => setCurrentStep(5)}
                        disabled={!treatmentPlan.some(t => t.selected)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 text-lg font-medium"
                      >
                        Generate Prescription
                        <Icons.ArrowRight className="h-5 w-5 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Prescription Generation */}
                {currentStep === 5 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                        <Icons.CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Step 5: Prescription Generation</h3>
                        <p className="text-gray-600">Review and finalize prescription for patient</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Prescription Summary */}
                      <div className="space-y-6">
                        <div className="bg-green-50 rounded-lg p-6">
                          <h4 className="font-semibold text-green-900 mb-4">Prescription Summary</h4>
                          <div className="space-y-4">
                            <div>
                              <span className="text-green-700 font-medium">Patient:</span>
                              <span className="ml-2 text-green-900">{selectedPatient.patientName}</span>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Diagnosis:</span>
                              <span className="ml-2 text-green-900">{selectedDiagnosis}</span>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Date:</span>
                              <span className="ml-2 text-green-900">{new Date().toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-6">
                          <h4 className="font-semibold text-blue-900 mb-4">Selected Medications</h4>
                          <div className="space-y-3">
                            {treatmentPlan.filter(t => t.selected).map((treatment, index) => (
                              <div key={index} className="bg-white p-4 rounded border">
                                <div className="font-medium text-blue-900">{treatment.medication} {treatment.dosage}</div>
                                <div className="text-sm text-blue-700">{treatment.frequency} for {treatment.duration}</div>
                                <div className="text-xs text-blue-600 mt-1">{treatment.instructions}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Patient Education & Follow-up */}
                      <div className="space-y-6">
                        <div className="bg-yellow-50 rounded-lg p-6">
                          <h4 className="font-semibold text-yellow-900 mb-4">Patient Education</h4>
                          <div className="space-y-2 text-sm text-yellow-800">
                            <div>• Take medications as prescribed</div>
                            <div>• Complete full course of treatment</div>
                            <div>• Monitor for side effects</div>
                            <div>• Return if symptoms worsen</div>
                            <div>• Follow-up appointment in 1-2 weeks</div>
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-6">
                          <h4 className="font-semibold text-red-900 mb-4">Drug Interaction Check</h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-green-700">
                              <Icons.CheckCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm">No major interactions detected</span>
                            </div>
                            <div className="flex items-center text-green-700">
                              <Icons.CheckCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm">Allergy check passed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                      >
                        <Icons.ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Treatment
                      </button>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleGeneratePrescription}
                          disabled={isGeneratingPrescription}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 text-lg font-medium"
                        >
                          {isGeneratingPrescription ? (
                            <LoadingSpinner size="sm" text="Sending..." />
                          ) : (
                            <>
                              <Icons.Send className="h-5 w-5 mr-2" />
                              Send to Pharmacy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStep(1);
                            setClinicalNotes('');
                            setDifferentialDiagnoses([]);
                            setSelectedDiagnosis('');
                            setTreatmentPlan([]);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                        >
                          <Icons.Plus className="h-5 w-5 mr-2" />
                          New Patient
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SOAP Notes Documentation System */}
                {showSOAPEditor && selectedPatient && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">SOAP Documentation System</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowSOAPEditor(false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors"
                          >
                            Close SOAP Editor
                          </button>
                        </div>
                      </div>

                      {/* Enhanced Layout: Compact Side Panels + Large Writing Area */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Panel: Patient History - Compact */}
                        <div className="lg:col-span-1">
                          <div className="bg-gray-50 rounded-lg p-3 h-80 overflow-y-auto">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                              <Icons.Clock className="h-4 w-4 mr-2" />
                              Patient History
                            </h4>
                            <div className="space-y-2">
                              {patientHistory.map((item, index) => (
                                <div key={index} className="text-xs text-gray-700 p-2 bg-white rounded border">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Clinical Suggestions - Compact */}
                        <div className="lg:col-span-1">
                          <div className="bg-blue-50 rounded-lg p-3 h-80 overflow-y-auto">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                              <Icons.Lightbulb className="h-4 w-4 mr-2" />
                              {activeSOAPSection} Suggestions
                            </h4>
                            <div className="space-y-2">
                              {noteSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-2 rounded border hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <span className={`px-1 py-0.5 rounded text-xs font-medium mb-1 inline-block ${
                                        suggestion.type === 'autocomplete'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {suggestion.type === 'autocomplete' ? 'Template' : 'Consider'}
                                      </span>
                                      <p className="text-xs text-gray-700">{suggestion.suggestion}</p>
                                    </div>
                                    <button
                                      onClick={() => applySuggestion(suggestion)}
                                      className="ml-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Center Panel: SOAP Navigation - Compact */}
                        <div className="lg:col-span-2">
                          <div className="bg-green-50 rounded-lg p-3 h-80">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">SOAP Navigation</h4>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              {[
                                { key: 'S', label: 'Subjective', desc: 'Patient reports', color: 'bg-blue-600' },
                                { key: 'O', label: 'Objective', desc: 'Exam findings', color: 'bg-green-600' },
                                { key: 'A', label: 'Assessment', desc: 'Diagnosis', color: 'bg-orange-600' },
                                { key: 'P', label: 'Plan', desc: 'Treatment', color: 'bg-purple-600' }
                              ].map((section) => (
                                <button
                                  key={section.key}
                                  onClick={() => {
                                    setActiveSOAPSection(section.key as 'S' | 'O' | 'A' | 'P');
                                    loadSOAPSuggestions(section.key as 'S' | 'O' | 'A' | 'P', selectedPatient);
                                  }}
                                  className={`p-3 rounded-lg text-center transition-colors ${
                                    activeSOAPSection === section.key
                                      ? `${section.color} text-white shadow-lg`
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                  }`}
                                >
                                  <div className="font-bold text-lg">{section.key}</div>
                                  <div className="text-xs font-medium">{section.label}</div>
                                  <div className="text-xs opacity-75">{section.desc}</div>
                                </button>
                              ))}
                            </div>

                            <div className="text-center bg-white rounded-lg p-3 border">
                              <div className="text-sm text-gray-600 mb-1">Currently Editing:</div>
                              <div className={`text-xl font-bold ${
                                activeSOAPSection === 'S' ? 'text-blue-600' :
                                activeSOAPSection === 'O' ? 'text-green-600' :
                                activeSOAPSection === 'A' ? 'text-orange-600' : 'text-purple-600'
                              }`}>
                                {activeSOAPSection} - {
                                  activeSOAPSection === 'S' ? 'Subjective' :
                                  activeSOAPSection === 'O' ? 'Objective' :
                                  activeSOAPSection === 'A' ? 'Assessment' : 'Plan'
                                }
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {activeSOAPSection === 'S' ? 'Document patient-reported symptoms and history' :
                                 activeSOAPSection === 'O' ? 'Record examination findings and vital signs' :
                                 activeSOAPSection === 'A' ? 'Clinical diagnosis and assessment' : 'Treatment plan and follow-up'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ENHANCED SOAP Notes Editor - Primary Writing Area */}
                    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            activeSOAPSection === 'S' ? 'bg-blue-600' :
                            activeSOAPSection === 'O' ? 'bg-green-600' :
                            activeSOAPSection === 'A' ? 'bg-orange-600' : 'bg-purple-600'
                          }`}></div>
                          <h4 className="text-2xl font-bold text-gray-900">
                            {activeSOAPSection} Section - {
                              activeSOAPSection === 'S' ? 'Subjective (Patient Reports)' :
                              activeSOAPSection === 'O' ? 'Objective (Examination Findings)' :
                              activeSOAPSection === 'A' ? 'Assessment (Clinical Diagnosis)' : 'Plan (Treatment & Follow-up)'
                            }
                          </h4>
                        </div>
                        <div className="flex space-x-3">
                          {[
                            { key: 'S', label: 'Subjective', color: 'bg-blue-600' },
                            { key: 'O', label: 'Objective', color: 'bg-green-600' },
                            { key: 'A', label: 'Assessment', color: 'bg-orange-600' },
                            { key: 'P', label: 'Plan', color: 'bg-purple-600' }
                          ].map((section) => (
                            <button
                              key={section.key}
                              onClick={() => {
                                setActiveSOAPSection(section.key as 'S' | 'O' | 'A' | 'P');
                                loadSOAPSuggestions(section.key as 'S' | 'O' | 'A' | 'P', selectedPatient);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                                activeSOAPSection === section.key
                                  ? `${section.color} text-white shadow-lg`
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {section.key} - {section.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Large, Prominent Writing Area */}
                      <div className="relative">
                        <textarea
                          value={soapNotes[{
                            'S': 'subjective',
                            'O': 'objective',
                            'A': 'assessment',
                            'P': 'plan'
                          }[activeSOAPSection] as keyof typeof soapNotes]}
                          onChange={(e) => {
                            const sectionKey = {
                              'S': 'subjective',
                              'O': 'objective',
                              'A': 'assessment',
                              'P': 'plan'
                            }[activeSOAPSection] as keyof typeof soapNotes;

                            setSOAPNotes(prev => ({
                              ...prev,
                              [sectionKey]: e.target.value
                            }));
                          }}
                          className={`w-full h-96 px-6 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 text-base leading-relaxed resize-none ${
                            activeSOAPSection === 'S' ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-200' :
                            activeSOAPSection === 'O' ? 'border-green-300 focus:border-green-500 focus:ring-green-200' :
                            activeSOAPSection === 'A' ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-200' :
                            'border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                          }`}
                          placeholder={`Enter detailed ${
                            activeSOAPSection === 'S' ? 'patient-reported symptoms, history, and concerns' :
                            activeSOAPSection === 'O' ? 'examination findings, vital signs, and objective data' :
                            activeSOAPSection === 'A' ? 'clinical assessment, diagnosis, and reasoning' :
                            'treatment plan, medications, and follow-up instructions'
                          }...`}
                          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
                        />

                        {/* Character Count and Section Indicator */}
                        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow-sm">
                          <span className="text-sm text-gray-500">
                            {soapNotes[{
                              'S': 'subjective',
                              'O': 'objective',
                              'A': 'assessment',
                              'P': 'plan'
                            }[activeSOAPSection] as keyof typeof soapNotes].length} characters
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Action Bar */}
                      <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600">
                            💡 <strong>Tip:</strong> Use the suggestions panel on the right to enhance your documentation
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activeSOAPSection === 'S' ? 'bg-blue-100 text-blue-800' :
                            activeSOAPSection === 'O' ? 'bg-green-100 text-green-800' :
                            activeSOAPSection === 'A' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            Currently editing: {activeSOAPSection} Section
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              const sectionKey = {
                                'S': 'subjective',
                                'O': 'objective',
                                'A': 'assessment',
                                'P': 'plan'
                              }[activeSOAPSection] as keyof typeof soapNotes;

                              setSOAPNotes(prev => ({
                                ...prev,
                                [sectionKey]: ''
                              }));
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                          >
                            <Icons.X className="h-4 w-4 mr-2" />
                            Clear Section
                          </button>
                          <button
                            onClick={handleGeneratePrescription}
                            disabled={isGeneratingPrescription}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 shadow-lg"
                          >
                            {isGeneratingPrescription ? (
                              <LoadingSpinner size="sm" text="Generating..." />
                            ) : (
                              <>
                                <Icons.FileText className="h-4 w-4 mr-2" />
                                Generate Prescription from SOAP
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Prescription */}
                {prescription && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Prescription</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900">{prescription.prescriptionText}</pre>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                        Send to Pharmacy
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                        Print Prescription
                      </button>
                      <button
                        onClick={() => setPrescription(null)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <Icons.Stethoscope className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">AI-Assisted Clinical Workflow</h3>
                  <p className="text-gray-600 mb-4">Select a patient case to begin the 5-step clinical workflow with AI assistance</p>

                  {/* Workflow Preview */}
                  <div className="flex items-center justify-center space-x-4 mb-8">
                    {[
                      { step: 1, label: 'History', icon: Icons.Clock, color: 'bg-blue-100 text-blue-600' },
                      { step: 2, label: 'Notes', icon: Icons.FileText, color: 'bg-green-100 text-green-600' },
                      { step: 3, label: 'Diagnosis', icon: Icons.Search, color: 'bg-orange-100 text-orange-600' },
                      { step: 4, label: 'Treatment', icon: Icons.Pill, color: 'bg-purple-100 text-purple-600' },
                      { step: 5, label: 'Prescription', icon: Icons.CheckCircle, color: 'bg-green-100 text-green-600' }
                    ].map(({ step, label, icon: Icon, color }, index) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="ml-2 text-center">
                          <div className="text-xs font-medium text-gray-600">{step}</div>
                          <div className="text-xs text-gray-500">{label}</div>
                        </div>
                        {index < 4 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientCases.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        loadComprehensivePatientHistory(patient);
                        setCurrentStep(1);
                      }}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all transform hover:scale-105"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{patient.patientName}</h5>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          patient.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                          patient.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {patient.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Age: {patient.age}</p>
                      <p className="text-sm text-gray-700 mb-4">{patient.symptoms}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {patient.appointmentTime.toLocaleTimeString()}
                        </span>
                        <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                          Start Workflow
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Prescription Management</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Icons.FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prescription History</h3>
                <p className="text-gray-600">Generated prescriptions and medication management tools will appear here.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Clinical Analytics</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Icons.TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600">Clinical performance metrics and analytics dashboard will be displayed here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
