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

  // SOAP Notes state
  const [activeSOAPSection, setActiveSOAPSection] = useState<'S' | 'O' | 'A' | 'P'>('S');
  const [soapNotes, setSOAPNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [showSOAPEditor, setShowSOAPEditor] = useState(false);
  const [patientHistory, setPatientHistory] = useState<string[]>([]);

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
                {/* Patient Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPatient.patientName}</h2>
                      <p className="text-sm text-gray-600">Age: {selectedPatient.age} | Case ID: {selectedPatient.id}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(selectedPatient.urgency)}`}>
                          {selectedPatient.urgency}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPatient.status)}`}>
                          {selectedPatient.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
                    >
                      Back to Cases
                    </button>
                  </div>
                </div>

                {/* Clinical Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Information & Symptoms */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedPatient.symptoms}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPatient.appointmentTime.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => handleGenerateNotes(selectedPatient)}
                        disabled={isGeneratingNotes}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {isGeneratingNotes ? (
                          <LoadingSpinner size="sm" text="Generating AI Notes..." />
                        ) : (
                          <>
                            <Icons.Sparkles className="h-4 w-4 mr-2" />
                            Generate AI Clinical Notes
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          initializeSOAPNotes(selectedPatient);
                          generatePatientHistory(selectedPatient);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                      >
                        <Icons.FileText className="h-4 w-4 mr-2" />
                        Start SOAP Documentation
                      </button>
                    </div>
                  </div>

                  {/* AI-Generated Clinical Notes */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Clinical Assessment</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Generated Notes</label>
                        <textarea
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="AI-generated clinical notes will appear here..."
                        />
                      </div>

                      <button
                        onClick={handleGeneratePrescription}
                        disabled={isGeneratingPrescription || !doctorNotes.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {isGeneratingPrescription ? (
                          <LoadingSpinner size="sm" text="Generating Prescription..." />
                        ) : (
                          <>
                            <Icons.FileText className="h-4 w-4 mr-2" />
                            Generate Prescription
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

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

                      {/* Three-Panel Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel: Patient History */}
                        <div className="lg:col-span-1">
                          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Icons.Clock className="h-4 w-4 mr-2" />
                              Patient History
                            </h4>
                            <div className="space-y-3">
                              {patientHistory.map((item, index) => (
                                <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Clinical Suggestions */}
                        <div className="lg:col-span-1">
                          <div className="bg-blue-50 rounded-lg p-4 h-96 overflow-y-auto">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Icons.Lightbulb className="h-4 w-4 mr-2" />
                              {activeSOAPSection} Section Suggestions
                            </h4>
                            <div className="space-y-2">
                              {noteSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded border hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium mb-2 inline-block ${
                                        suggestion.type === 'autocomplete'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {suggestion.type === 'autocomplete' ? 'Template' : 'Consider'}
                                      </span>
                                      <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                                    </div>
                                    <button
                                      onClick={() => applySuggestion(suggestion)}
                                      className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Center Panel: SOAP Section Tabs */}
                        <div className="lg:col-span-1">
                          <div className="bg-green-50 rounded-lg p-4 h-96">
                            <h4 className="font-semibold text-gray-900 mb-3">SOAP Navigation</h4>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {[
                                { key: 'S', label: 'Subjective', desc: 'Patient reports' },
                                { key: 'O', label: 'Objective', desc: 'Exam findings' },
                                { key: 'A', label: 'Assessment', desc: 'Diagnosis' },
                                { key: 'P', label: 'Plan', desc: 'Treatment' }
                              ].map((section) => (
                                <button
                                  key={section.key}
                                  onClick={() => {
                                    setActiveSOAPSection(section.key as 'S' | 'O' | 'A' | 'P');
                                    loadSOAPSuggestions(section.key as 'S' | 'O' | 'A' | 'P', selectedPatient);
                                  }}
                                  className={`p-3 rounded-lg text-left transition-colors ${
                                    activeSOAPSection === section.key
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-green-100'
                                  }`}
                                >
                                  <div className="font-semibold">{section.key} - {section.label}</div>
                                  <div className="text-xs opacity-75">{section.desc}</div>
                                </button>
                              ))}
                            </div>

                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-2">Active Section:</div>
                              <div className="text-lg font-bold text-green-600">
                                {activeSOAPSection} - {
                                  activeSOAPSection === 'S' ? 'Subjective' :
                                  activeSOAPSection === 'O' ? 'Objective' :
                                  activeSOAPSection === 'A' ? 'Assessment' : 'Plan'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SOAP Notes Editor */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {activeSOAPSection} Section - {
                            activeSOAPSection === 'S' ? 'Subjective (Patient Reports)' :
                            activeSOAPSection === 'O' ? 'Objective (Examination Findings)' :
                            activeSOAPSection === 'A' ? 'Assessment (Clinical Diagnosis)' : 'Plan (Treatment & Follow-up)'
                          }
                        </h4>
                        <div className="flex space-x-2">
                          {['S', 'O', 'A', 'P'].map((section) => (
                            <button
                              key={section}
                              onClick={() => {
                                setActiveSOAPSection(section as 'S' | 'O' | 'A' | 'P');
                                loadSOAPSuggestions(section as 'S' | 'O' | 'A' | 'P', selectedPatient);
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                activeSOAPSection === section
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {section}
                            </button>
                          ))}
                        </div>
                      </div>

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
                        className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                        placeholder={`Enter ${activeSOAPSection} section documentation...`}
                      />

                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Use the suggestions panel to enhance your documentation
                        </div>
                        <button
                          onClick={handleGeneratePrescription}
                          disabled={isGeneratingPrescription}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Icons.Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Patient Case</h3>
                <p className="text-gray-600 mb-4">Choose a patient from the cases list to access clinical tools and AI assistance.</p>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  View Patient Cases
                </button>
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
