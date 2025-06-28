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
    setDoctorNotes(prev => {
      if (suggestion.type === 'autocomplete') {
        return prev + '\n\n' + suggestion.suggestion;
      } else {
        return prev + '\n\nADDITIONAL CONSIDERATIONS:\n- ' + suggestion.suggestion;
      }
    });
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

                    <div className="mt-6">
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
