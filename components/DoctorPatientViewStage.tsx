
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Appointment, Prescription, ProvisionalDiagnosisResult, ChatMessage, PatientProfile, Medication, TestRecommendation, PrescriptionTab, DoctorNoteSuggestion, DDxItem, DDxActionSuggestion, DDxActionSuggestedMedication, DDxActionSuggestedTest } from '../types';
import { generateDoctorNotes, generatePrescriptionWithEducation, generatePrescriptionKeywords, generateDoctorNoteSuggestions, generateDifferentialDiagnoses, suggestActionsForDDx } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { Icons } from '../constants';

// Simple API client for enhanced features
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const apiClient = {
  async request<T>(endpoint: string, options: { body?: unknown } = {}): Promise<T | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) return null;
      return await response.json() as T;
    } catch (error) {
      console.error(`API Error calling ${endpoint}:`, error);
      return null;
    }
  }
};

interface DoctorPatientViewStageProps {
  appointment: Appointment;
  provisionalDiagnosis: ProvisionalDiagnosisResult; 
  initialSymptoms: string;
  chatHistory: ChatMessage[];
  suggestedTests: string[]; 
  uploadedReportsData?: string | null;
  patientProfile: PatientProfile | null; 
  onComplete: (prescription?: Prescription) => void;
  onViewPharmacyOrder: (prescription: Prescription) => void;
  onViewLabOrder: (prescription: Prescription) => void;
}

const EducativeItem: React.FC<{ title: string, content: string, type: 'med' | 'test' | 'advice' }> = ({ title, content, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  let IconComponent = Icons.InformationCircle;
  let iconColor = 'text-blue-600';

  if (type === 'med') {
    IconComponent = Icons.ChatBubble; 
    iconColor = 'text-green-600';
  } else if (type === 'test') {
    IconComponent = Icons.Search; 
    iconColor = 'text-purple-600';
  }

  return (
    <div className="border border-slate-200 rounded-lg mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="font-medium text-slate-700 flex items-center">
          <IconComponent className={`w-5 h-5 mr-2 ${iconColor}`} />
          {title}
        </span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="p-4 text-sm text-slate-600 bg-white rounded-b-lg prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
      )}
    </div>
  );
};


const DoctorPatientViewStage: React.FC<DoctorPatientViewStageProps> = ({
  appointment,
  provisionalDiagnosis,
  initialSymptoms, 
  uploadedReportsData,
  patientProfile, 
  onComplete,
  onViewPharmacyOrder,
  onViewLabOrder
}) => {
  const [doctorNotes, setDoctorNotes] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoadingInitialNotes, setIsLoadingInitialNotes] = useState<boolean>(true);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState<boolean>(false);
  const [doctorSummaryForPrescription, setDoctorSummaryForPrescription] = useState<string>(''); 
  const [activeTab, setActiveTab] = useState<PrescriptionTab>(PrescriptionTab.FORMAL);

  // AI Assistant Panel State
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState<boolean>(false); // Unified loading for notes/keywords
  const [doctorNoteAISuggestions, setDoctorNoteAISuggestions] = useState<DoctorNoteSuggestion[]>([]);
  const [prescriptionKeywords, setPrescriptionKeywords] = useState<string[]>([]);

  const [isLoadingDDx, setIsLoadingDDx] = useState<boolean>(false);
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<DDxItem[]>([]);
  const [selectedDDx, setSelectedDDx] = useState<DDxItem | null>(null);

  const [isLoadingDDxActions, setIsLoadingDDxActions] = useState<boolean>(false);
  const [ddxActionSuggestions, setDdxActionSuggestions] = useState<DDxActionSuggestion | null>(null);

  // Enhanced AI Features State
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState<boolean>(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [contextualAutocomplete, setContextualAutocomplete] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [autocompletePosition, setAutocompletePosition] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [currentCursorPosition, setCurrentCursorPosition] = useState<number>(0);
  const [structuredNotes, setStructuredNotes] = useState<{
    chiefComplaint: string;
    historyOfPresentIllness: string;
    physicalExamination: string;
    assessment: string;
  } | null>(null);
  const [isLoadingStructuredNotes, setIsLoadingStructuredNotes] = useState<boolean>(false);

  const notesTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Fetch initial AI-generated doctor notes (for review)
  useEffect(() => {
    const fetchInitialNotes = async () => {
      setIsLoadingInitialNotes(true);
      const notes = await generateDoctorNotes(
        appointment.patientSymptoms,
        provisionalDiagnosis.condition || "Not specified",
        patientProfile || undefined, 
        uploadedReportsData 
      );
      setDoctorNotes(notes || "Could not generate initial notes for the doctor.");
      setIsLoadingInitialNotes(false);
    };
    fetchInitialNotes();
  }, [appointment.patientSymptoms, provisionalDiagnosis.condition, patientProfile, uploadedReportsData]);

  // Pre-fill doctor's summary
   useEffect(() => {
    if (provisionalDiagnosis.condition && !doctorSummaryForPrescription) {
      let summary = `Patient presents with symptoms suggestive of ${provisionalDiagnosis.condition}. `;
      if (patientProfile?.age) summary += `Age: ${patientProfile.age}. `;
      if (patientProfile?.pastHistory) summary += `History: ${patientProfile.pastHistory}. `;
      setDoctorSummaryForPrescription(summary);
    }
  }, [provisionalDiagnosis.condition, patientProfile, doctorSummaryForPrescription]);


  // Effect for DDx Action Suggestions when a DDx is selected
  useEffect(() => {
    const fetchActions = async () => {
      if (selectedDDx) {
        setIsLoadingDDxActions(true);
        setDdxActionSuggestions(null);
        const actions = await suggestActionsForDDx(selectedDDx.condition, patientProfile || undefined);
        setDdxActionSuggestions(actions);
        setIsLoadingDDxActions(false);
      } else {
        setDdxActionSuggestions(null); // Clear actions if no DDx is selected
      }
    };
    fetchActions();
  }, [selectedDDx, patientProfile]);


  const handleGetAIAssistance = async () => {
    const logPrefix = "[PCA] DoctorPatientViewStage - handleGetAIAssistance:"
    console.log(`${logPrefix} Initiated.`);

    if (!doctorSummaryForPrescription.trim()) {
      console.warn(`${logPrefix} Aborted: Doctor summary is empty.`);
      return;
    }
    if (isLoadingAISuggestions || isLoadingDDx) {
      console.warn(`${logPrefix} Aborted: AI suggestions or DDx already loading.`);
      return;
    }

    setIsLoadingAISuggestions(true);
    setIsLoadingDDx(true);
    console.log(`${logPrefix} Loading states set to true.`);

    setDoctorNoteAISuggestions([]);
    setPrescriptionKeywords([]);
    setDifferentialDiagnoses([]);
    setSelectedDDx(null); 
    console.log(`${logPrefix} Cleared previous AI suggestions and DDx selection.`);

    try {
      console.log(`${logPrefix} Starting Promise.all for AI suggestions.`);
      const [suggestions, keywords, ddxResult] = await Promise.all([
        generateDoctorNoteSuggestions(doctorSummaryForPrescription, provisionalDiagnosis.condition || "N/A", patientProfile || undefined),
        generatePrescriptionKeywords(provisionalDiagnosis.condition || "N/A", doctorSummaryForPrescription),
        generateDifferentialDiagnoses(
          initialSymptoms, 
          provisionalDiagnosis.condition || "N/A",
          doctorSummaryForPrescription,
          patientProfile || undefined
        )
      ]);
      console.log(`${logPrefix} Promise.all completed successfully.`);
      console.log(`${logPrefix} Suggestions received:`, suggestions);
      console.log(`${logPrefix} Keywords received:`, keywords);
      console.log(`${logPrefix} DDx results received:`, ddxResult);

      setDoctorNoteAISuggestions(suggestions || []);
      setPrescriptionKeywords(keywords || []);
      setDifferentialDiagnoses(ddxResult || []);
    } catch (error) {
      console.error(`${logPrefix} Error during AI suggestion fetching:`, error);
      // Optionally set an error state to display to the user in the AI panel
      // For example: setAiPanelError("Could not fetch AI suggestions. Please try again.");
    } finally {
      console.log(`${logPrefix} Entering finally block.`);
      setIsLoadingAISuggestions(false);
      setIsLoadingDDx(false);
      console.log(`${logPrefix} Loading states set to false.`);
    }
  };


  const appendToDoctorSummary = (textToAppend: string, withNewline: boolean = true) => {
    setDoctorSummaryForPrescription(prev => {
      const newText = `${prev ? prev.trim() + (withNewline ? '\n' : ' ') : ''}${textToAppend}`;
      return newText;
    });
    notesTextAreaRef.current?.focus();
  };
  
  const handleSuggestionClick = (suggestionText: string) => {
    appendToDoctorSummary(suggestionText, false); 
  };
  
  const handleKeywordClick = (keyword: string) => {
    appendToDoctorSummary(keyword + '.', true);
  };

  const handleDDxSelection = (ddx: DDxItem) => {
    setSelectedDDx(ddx);
  };
  
  const handleDDxActionClick = (actionText: string) => {
    appendToDoctorSummary(actionText, true);
  };

  // Enhanced AI Features Functions
  const generateContextualAutocomplete = useCallback(async (currentText: string, cursorPosition: number) => {
    if (currentText.length < 3) {
      setContextualAutocomplete([]);
      return;
    }

    // Extract the current word being typed
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.length < 2) {
      setContextualAutocomplete([]);
      return;
    }

    try {
      // Call backend for contextual autocomplete suggestions
      const suggestions = await apiClient.request<string[]>('/doctor-assist/autocomplete', {
        body: {
          currentText: textBeforeCursor,
          currentWord,
          provisionalDiagnosis: provisionalDiagnosis.condition || '',
          patientProfile
        }
      });

      setContextualAutocomplete(suggestions || []);
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      setContextualAutocomplete([]);
    }
  }, [provisionalDiagnosis.condition, patientProfile]);

  const generateSmartSuggestions = useCallback(async (currentText: string) => {
    if (!currentText.trim()) {
      setSmartSuggestions([]);
      return;
    }

    try {
      const suggestions = await apiClient.request<string[]>('/doctor-assist/smart-suggestions', {
        body: {
          currentText,
          provisionalDiagnosis: provisionalDiagnosis.condition || '',
          patientProfile,
          selectedDDx: selectedDDx?.condition
        }
      });

      setSmartSuggestions(suggestions || []);
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      setSmartSuggestions([]);
    }
  }, [provisionalDiagnosis.condition, patientProfile, selectedDDx]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setDoctorSummaryForPrescription(newValue);
    setCurrentCursorPosition(cursorPosition);

    // Clear existing AI suggestions when notes change
    if (doctorNoteAISuggestions.length > 0 || prescriptionKeywords.length > 0 || differentialDiagnoses.length > 0) {
      setDoctorNoteAISuggestions([]);
      setPrescriptionKeywords([]);
      setDifferentialDiagnoses([]);
      setSelectedDDx(null);
    }

    // Generate contextual autocomplete with debouncing
    const timeoutId = setTimeout(() => {
      generateContextualAutocomplete(newValue, cursorPosition);
      generateSmartSuggestions(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [doctorNoteAISuggestions.length, prescriptionKeywords.length, differentialDiagnoses.length, generateContextualAutocomplete, generateSmartSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && contextualAutocomplete.length > 0) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const suggestion = contextualAutocomplete[0]; // Select first suggestion
        insertAutocompleteText(suggestion);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    }
  }, [showAutocomplete, contextualAutocomplete]);

  const insertAutocompleteText = useCallback((suggestion: string) => {
    const textarea = notesTextAreaRef.current;
    if (!textarea) return;

    const currentText = doctorSummaryForPrescription;
    const cursorPosition = currentCursorPosition;

    // Find the start of the current word
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    const wordStartPosition = cursorPosition - currentWord.length;

    // Replace the current word with the suggestion
    const newText = currentText.substring(0, wordStartPosition) + suggestion + currentText.substring(cursorPosition);

    setDoctorSummaryForPrescription(newText);
    setShowAutocomplete(false);
    setContextualAutocomplete([]);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(wordStartPosition + suggestion.length, wordStartPosition + suggestion.length);
    }, 0);
  }, [doctorSummaryForPrescription, currentCursorPosition]);

  const handleSummarizeNotes = async () => {
    if (!doctorSummaryForPrescription.trim()) {
      alert("Please enter some notes to summarize.");
      return;
    }

    setIsLoadingStructuredNotes(true);
    try {
      const structured = await apiClient.request<{
        chiefComplaint: string;
        historyOfPresentIllness: string;
        physicalExamination: string;
        assessment: string;
      }>('/doctor-assist/summarize-notes', {
        body: {
          rawNotes: doctorSummaryForPrescription,
          provisionalDiagnosis: provisionalDiagnosis.condition || '',
          patientProfile
        }
      });

      setStructuredNotes(structured);
    } catch (error) {
      console.error('Error summarizing notes:', error);
      alert('Failed to summarize notes. Please try again.');
    } finally {
      setIsLoadingStructuredNotes(false);
    }
  };

  const applyStructuredNotes = () => {
    if (!structuredNotes) return;

    const formattedNotes = `CHIEF COMPLAINT:
${structuredNotes.chiefComplaint}

HISTORY OF PRESENT ILLNESS:
${structuredNotes.historyOfPresentIllness}

PHYSICAL EXAMINATION:
${structuredNotes.physicalExamination}

ASSESSMENT:
${structuredNotes.assessment}`;

    setDoctorSummaryForPrescription(formattedNotes);
    setStructuredNotes(null);
  };

  const handleGeneratePrescription = async () => {
    if (!doctorSummaryForPrescription.trim()) {
        alert("Please enter your notes and plan for the prescription.");
        return;
    }
    setIsLoadingPrescription(true);
    const doctorName = appointment.clinic?.doctorName || patientProfile?.name || 'Your Doctor';
    const clinicAddress = appointment.clinic?.address || 'Clinic Address';
    const clinicLicense = appointment.clinic?.clinicLicense || 'License N/A';

    const finalDiagnosisForPrescription = selectedDDx?.condition || provisionalDiagnosis.condition || "General Wellness";

    const generatedPrescription = await generatePrescriptionWithEducation(
      finalDiagnosisForPrescription,
      doctorSummaryForPrescription, 
      doctorName,
      clinicAddress,
      clinicLicense
    );
    setPrescription(generatedPrescription);
    setIsLoadingPrescription(false);
  };

  const AILoadingIndicator = ({text = "AI thinking..."}: {text?:string}) => <div className="flex items-center text-xs text-slate-500"><LoadingSpinner size="sm" /> <span className="ml-2">{text}</span></div>;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Consultation Hub</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Patient Info, Doctor Notes, Prescription Output */}
        <div className="lg:w-2/3 space-y-6">
          {/* Patient and Appointment Info */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Consultation Details</h3>
            <p className="text-sm text-slate-600"><strong>Patient:</strong> {patientProfile?.name ? `${patientProfile.name} (Age: ${patientProfile.age || 'N/A'})` : 'N/A'}</p>
            <p className="text-sm text-slate-600"><strong>Appointment:</strong> {new Date(appointment.dateTime).toLocaleString()}</p>
            <p className="text-sm text-slate-600"><strong>Initial AI Assessment:</strong> <span className="font-medium">{provisionalDiagnosis.condition || "N/A"}</span> (Confidence: {provisionalDiagnosis.confidence || 'N/A'})</p>
            {uploadedReportsData && <p className="text-sm text-slate-600"><strong>Uploaded Reports:</strong> <span className="italic">"{uploadedReportsData.substring(0,100)}..."</span></p>}
            <h4 className="font-medium text-slate-700 mt-3 mb-1">AI Pre-Consultation Notes:</h4>
            {isLoadingInitialNotes ? <LoadingSpinner text="Generating notes..." size="sm" /> : (
              <div className="text-xs p-2 bg-white border rounded whitespace-pre-wrap custom-scrollbar max-h-28 overflow-y-auto">{doctorNotes}</div>
            )}
          </div>

          {!prescription && (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold text-indigo-700">Doctor's Notes & Plan</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSummarizeNotes}
                    disabled={!doctorSummaryForPrescription.trim() || isLoadingStructuredNotes}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoadingStructuredNotes ? <LoadingSpinner size="sm" /> : <><Icons.Sparkles className="w-3 h-3 mr-1" /> Summarize Notes</>}
                  </button>
                </div>
              </div>
              <p className="text-xs text-indigo-600 mb-3">Type your observations, assessment, and plan. Use Tab to accept autocomplete suggestions.</p>

              {/* Smart Suggestions Panel */}
              {smartSuggestions.length > 0 && (
                <div className="mb-3 p-2 bg-white rounded border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-700 mb-1">Smart Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => appendToDoctorSummary(suggestion, true)}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded border border-indigo-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                    ref={notesTextAreaRef}
                    value={doctorSummaryForPrescription}
                    onChange={handleNotesChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowAutocomplete(contextualAutocomplete.length > 0)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    placeholder="e.g., Patient c/o sore throat, fever. On exam, tonsillar exudates noted. Plan for rapid strep..."
                    className="w-full p-2 border border-indigo-300 rounded-md h-40 custom-scrollbar text-sm focus:ring-1 focus:ring-indigo-500"
                    aria-label="Doctor's notes and plan"
                />

                {/* Contextual Autocomplete Dropdown */}
                {showAutocomplete && contextualAutocomplete.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto"
                    style={{
                      top: '100%',
                      left: '0',
                      right: '0'
                    }}
                  >
                    {contextualAutocomplete.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => insertAutocompleteText(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structured Notes Summary */}
          {structuredNotes && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-yellow-700">AI-Generated Structured Summary</h3>
                <div className="flex gap-2">
                  <button
                    onClick={applyStructuredNotes}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-md"
                  >
                    Apply to Notes
                  </button>
                  <button
                    onClick={() => setStructuredNotes(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-md"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-yellow-800">Chief Complaint:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.chiefComplaint}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">History of Present Illness:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.historyOfPresentIllness}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Physical Examination:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.physicalExamination}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Assessment:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.assessment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Structured Notes Summary */}
          {structuredNotes && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-yellow-700">AI-Generated Structured Summary</h3>
                <div className="flex gap-2">
                  <button
                    onClick={applyStructuredNotes}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-md"
                  >
                    Apply to Notes
                  </button>
                  <button
                    onClick={() => setStructuredNotes(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-md"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-yellow-800">Chief Complaint:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.chiefComplaint}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">History of Present Illness:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.historyOfPresentIllness}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Physical Examination:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.physicalExamination}</p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Assessment:</h4>
                  <p className="text-yellow-700 bg-white p-2 rounded border">{structuredNotes.assessment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Display Area */}
          {isLoadingPrescription && !prescription && <div className="p-4 text-center"><LoadingSpinner text="Generating prescription details..." /></div>}
          {prescription && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="mb-4 border-b border-green-300">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                  {(Object.values(PrescriptionTab) as PrescriptionTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-green-500 text-green-700'
                          : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                      aria-current={activeTab === tab ? 'page' : undefined}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              {/* Tab Content */}
              <div>
                {activeTab === PrescriptionTab.FORMAL && (
                  <div className="space-y-3 text-sm">
                    <h3 className="text-md font-semibold text-green-800">Formal Prescription</h3>
                     <p><strong>Doctor:</strong> {prescription.doctorName || 'N/A'}</p>
                     <p><strong>Clinic:</strong> {prescription.clinicAddress || 'N/A'}</p>
                    {(prescription.clinicLicense && prescription.clinicLicense !== 'License N/A') && <p><strong>License:</strong> {prescription.clinicLicense}</p>}

                    {prescription.medications && prescription.medications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mt-2 mb-1">Medications:</h4>
                        <ul className="list-disc list-inside pl-2 space-y-1">
                          {prescription.medications.map((med, index) => (
                            <li key={index}><strong>{med.name} {med.dosage}:</strong> {med.instructions}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prescription.tests && prescription.tests.length > 0 && (
                      <div>
                        <h4 className="font-medium text-purple-700 mt-2 mb-1">Recommended Tests:</h4>
                        <ul className="list-disc list-inside pl-2 space-y-1">
                          {prescription.tests.map((test, index) => (
                            <li key={index}><strong>{test.name}:</strong> {test.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prescription.generalAdvice && (
                      <div>
                        <h4 className="font-medium text-blue-700 mt-2 mb-1">General Advice:</h4>
                        <p>{prescription.generalAdvice}</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === PrescriptionTab.EDUCATION && (
                  <div className="space-y-2">
                    <h3 className="text-md font-semibold text-green-800">Patient Education</h3>
                    {prescription.medications.map((med, index) => (
                      <EducativeItem 
                          key={`med-edu-${index}`}
                          title={`${med.name} (${med.dosage})`}
                          content={`<strong>What it's for & How it helps:</strong><br/>${med.education}<br/><br/><strong>Important Instructions:</strong><br/>${med.instructions}<br/><br/><strong>Tips for taking your medication:</strong><br/>${med.adherenceTips}`}
                          type="med" />
                    ))}
                    {prescription.tests.map((test, index) => (
                      <EducativeItem 
                          key={`test-edu-${index}`}
                          title={test.name}
                          content={`<strong>Why this test is recommended:</strong><br/>${test.reason}<br/><br/><strong>What to expect & How it helps:</strong><br/>${test.education}`}
                          type="test" />
                    ))}
                    {prescription.generalAdvice && (
                      <EducativeItem title="Important Health Information" content={prescription.generalAdvice} type="advice" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4">This information is for educational purposes. Always follow your doctor's specific instructions.</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button onClick={() => onViewPharmacyOrder(prescription)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg text-xs" disabled={!prescription.medications || prescription.medications.length === 0}>View Pharmacy Order</button>
                <button onClick={() => onViewLabOrder(prescription)} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg text-xs" disabled={!prescription.tests || prescription.tests.length === 0}>View Lab Order</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Enhanced AI Assistant Panel */}
        {!prescription && (
          <div className={`lg:w-1/3 transition-all duration-300 ${aiPanelCollapsed ? 'lg:w-12' : 'lg:w-1/3'}`}>
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300 space-y-4 custom-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between sticky top-0 bg-slate-100 py-2 z-10 -mt-4 -mx-4 px-4 border-b border-slate-300 rounded-t-lg">
                <h3 className={`text-lg font-semibold text-slate-700 flex items-center ${aiPanelCollapsed ? 'hidden' : ''}`}>
                  <Icons.Sparkles className="w-5 h-5 mr-2 text-blue-500" /> AI Assistant
                </h3>
                <button
                  onClick={() => setAiPanelCollapsed(!aiPanelCollapsed)}
                  className="text-slate-500 hover:text-slate-700 p-1 rounded"
                  title={aiPanelCollapsed ? "Expand AI Panel" : "Collapse AI Panel"}
                >
                  {aiPanelCollapsed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              </div>

              {!aiPanelCollapsed && (
                <>
            
            <button
              onClick={handleGetAIAssistance}
              disabled={!doctorSummaryForPrescription.trim() || isLoadingAISuggestions || isLoadingDDx}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Analyze doctor's notes and get AI suggestions"
            >
              {isLoadingAISuggestions || isLoadingDDx ? <LoadingSpinner size="sm" text="Analyzing..." /> : <><Icons.Sparkles className="w-4 h-4 mr-2" /> Analyze Notes & Get AI Suggestions</>}
            </button>

            {/* Note Suggestions & Keywords */}
            {(isLoadingAISuggestions || doctorNoteAISuggestions.length > 0 || prescriptionKeywords.length > 0) && (
              <div className="space-y-1 pt-3 border-t border-slate-300">
                <p className="text-xs font-medium text-slate-600">Note Completion & Keywords:</p>
                {isLoadingAISuggestions && <AILoadingIndicator text="Fetching suggestions..." />}
                {!isLoadingAISuggestions && doctorNoteAISuggestions.length === 0 && prescriptionKeywords.length === 0 && <p className="text-xs text-slate-500">No suggestions or keywords found for current notes. Click "Analyze Notes" above.</p>}
                <div className="flex flex-wrap gap-1">
                  {doctorNoteAISuggestions.map((s, i) => (
                    <button key={`notesuggest-${i}`} onClick={() => handleSuggestionClick(s.suggestion)}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs px-2 py-0.5 rounded-full border border-indigo-300" title={s.type}>
                      {s.suggestion}
                    </button>
                  ))}
                  {prescriptionKeywords.map(keyword => (
                    <button key={keyword} onClick={() => handleKeywordClick(keyword)}
                            className="bg-teal-100 text-teal-700 hover:bg-teal-200 text-xs px-2 py-0.5 rounded-full border border-teal-300">
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Differential Diagnoses (DDx) */}
            {(isLoadingDDx || differentialDiagnoses.length > 0) && (
                <div className="pt-3 border-t border-slate-300 space-y-1">
                    <p className="text-xs font-medium text-slate-600">Differential Diagnoses (DDx):</p>
                    {isLoadingDDx && <AILoadingIndicator text="Generating DDx..." />}
                    {!isLoadingDDx && differentialDiagnoses.length === 0 && <p className="text-xs text-slate-500">No specific DDx to suggest based on current notes. Click "Analyze Notes" above.</p>}
                    {differentialDiagnoses.map((ddx, i) => (
                        <button key={`ddx-${i}`} onClick={() => handleDDxSelection(ddx)}
                            className={`w-full text-left p-2 border rounded-md cursor-pointer text-xs hover:bg-purple-100 ${selectedDDx?.condition === ddx.condition ? 'bg-purple-200 border-purple-400 ring-1 ring-purple-400' : 'bg-white border-purple-300'}`}>
                        <h4 className="font-semibold text-purple-800">{ddx.condition}</h4>
                        <p className="text-purple-700">{ddx.rationale}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* DDx Action Suggestions */}
            {selectedDDx && (
              <div className="pt-3 border-t border-slate-300 space-y-1">
                <p className="text-xs font-medium text-slate-600">Actions for <span className="font-bold">{selectedDDx.condition}</span>:</p>
                {isLoadingDDxActions && <AILoadingIndicator text="Fetching actions..." />}
                {!isLoadingDDxActions && ddxActionSuggestions && (
                  <div className="space-y-2 text-xs">
                    {ddxActionSuggestions.suggestedTests.map((test, i) => (
                      <button key={`testaction-${i}`} onClick={() => handleDDxActionClick(`Consider Test: ${test.name} for ${test.reason}.`)}
                              className="block w-full text-left bg-sky-100 text-sky-700 hover:bg-sky-200 p-1.5 rounded border border-sky-300">
                        <strong>Test:</strong> {test.name} <span className="text-sky-600">({test.reason})</span>
                      </button>
                    ))}
                    {ddxActionSuggestions.suggestedMedications.map((med, i) => (
                      <button key={`medaction-${i}`} onClick={() => handleDDxActionClick(`Prescribe: ${med.name} ${med.typicalDosage} - ${med.typicalInstructions}.`)}
                              className="block w-full text-left bg-lime-100 text-lime-700 hover:bg-lime-200 p-1.5 rounded border border-lime-300">
                        <strong>Med:</strong> {med.name} <span className="text-lime-600">({med.typicalDosage})</span>
                      </button>
                    ))}
                    {!ddxActionSuggestions.suggestedTests.length && !ddxActionSuggestions.suggestedMedications.length && (
                        <p className="text-xs text-slate-500">No specific common tests or medications flagged for this selection.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {!isLoadingAISuggestions && !isLoadingDDx &&
             !doctorNoteAISuggestions.length && !prescriptionKeywords.length && !differentialDiagnoses.length &&
             doctorSummaryForPrescription.trim() && (
                 <p className="text-xs text-slate-500 text-center py-2">Click "Analyze Notes & Get AI Suggestions" to populate this panel.</p>
            )}
              </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        {!prescription && (
            <button 
                onClick={handleGeneratePrescription} 
                disabled={isLoadingPrescription || !doctorSummaryForPrescription.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-base shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoadingPrescription ? <LoadingSpinner size="sm" /> : <><Icons.Sparkles className="w-5 h-5 mr-2" /> Generate Patient Prescription</>}
            </button>
        )}
        <button 
          onClick={() => onComplete(prescription || undefined)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          {prescription ? 'Finalize & Return to Welcome' : 'Cancel & Return to Welcome'}
        </button>
      </div>
    </div>
  );
};

export default DoctorPatientViewStage;
