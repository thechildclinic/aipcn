
import React, { useState, useCallback, useEffect } from 'react';
import { AppStage, ChatMessage, Clinic, Appointment, ProvisionalDiagnosisResult, PatientProfile, Episode, Prescription, BusinessType } from './types'; // Added Prescription, BusinessType
import SymptomInputStage from './components/SymptomInputStage';
import ClinicSelectionStage from './components/ClinicSelectionStage';
import BookingStage from './components/BookingStage';
import DoctorPatientViewStage from './components/DoctorPatientViewStage';
import PatientProfileStage from './components/PatientProfileStage'; 
import InteractionHistoryView from './components/InteractionHistoryView'; 
import PharmacyOrderView from './components/PharmacyOrderView';
import LabOrderView from './components/LabOrderView';
import MarketplaceWelcomeStage from './components/MarketplaceWelcomeStage'; // New
import MarketplaceOnboardingFormStage from './components/MarketplaceOnboardingFormStage'; // New
import MarketplaceConfirmationStage from './components/MarketplaceConfirmationStage'; // New
import { savePatientProfile, loadPatientProfile, saveEpisode, loadEpisodes } from './services/localStorageService'; 
import { Icons } from './constants';

const WelcomeScreen: React.FC<{ 
  onStart: () => void; 
  onViewHistory: () => void; 
  onManageProfile: () => void;
  onGoToMarketplace: () => void; // New prop
  hasProfile: boolean;
  hasHistory: boolean;
}> = ({ onStart, onViewHistory, onManageProfile, onGoToMarketplace, hasProfile, hasHistory }) => (
  <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg mx-auto text-center">
    <Icons.Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
    <h1 className="text-3xl font-bold text-slate-800 mb-4">AI Health Assistant</h1>
    <p className="text-slate-600 mb-8">
      {hasProfile ? "Welcome back! " : "Welcome! "} This tool helps you understand your symptoms, find a clinic, and prepare for your doctor's appointment.
      Our AI will guide you through a few steps.
    </p>
    <button
      onClick={onStart}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg mb-4 w-full"
    >
      {hasProfile ? "Start New Symptom Check" : "Get Started"}
    </button>
    {hasProfile && (
       <button
        onClick={onManageProfile}
        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-6 rounded-lg text-sm transition-colors mb-4 w-full"
      >
        Manage Your Profile
      </button>
    )}
    {hasHistory && (
      <button
        onClick={onViewHistory}
        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors w-full"
      >
        View Past Interactions
      </button>
    )}
    <div className="mt-8 pt-4 border-t border-slate-200">
        <button
            onClick={onGoToMarketplace}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
            Are you a Clinic, Lab, or Pharmacy? Join our Network
        </button>
    </div>
    <p className="text-xs text-slate-400 mt-6">
      This is a demonstration application. Information provided is not medical advice. Always consult a qualified healthcare professional for any health concerns.
      API Key for Gemini must be configured in environment variables. <br/>
      <span className="text-slate-400 cursor-default" title="Full clinic and lab onboarding requires a dedicated backend system.">Clinic/Lab Onboarding (Conceptual)</span>
    </p>
  </div>
);


const App: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<AppStage>(AppStage.WELCOME);
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  const [initialSymptoms, setInitialSymptoms] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState<ProvisionalDiagnosisResult | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<string[]>([]); 
  const [uploadedReportsData, setUploadedReportsData] = useState<string | null>(null);

  const [activePrescriptionForOrders, setActivePrescriptionForOrders] = useState<Prescription | null>(null);
  
  // State for marketplace onboarding
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);


  useEffect(() => {
    const loadedProfile = loadPatientProfile();
    if (loadedProfile) {
      setPatientProfile(loadedProfile);
    }
    const loadedEpisodes = loadEpisodes();
    setEpisodes(loadedEpisodes);
  }, []);

  const handleProfileSaved = useCallback((profile: PatientProfile) => {
    setPatientProfile(profile);
    savePatientProfile(profile);
    setCurrentStage(AppStage.SYMPTOM_INPUT_CHAT);
  }, []);

  const handleSymptomAnalysisComplete = useCallback((diagnosisResult: ProvisionalDiagnosisResult, symptoms: string, history: ChatMessage[]) => {
    setProvisionalDiagnosis(diagnosisResult);
    setInitialSymptoms(symptoms);
    setChatHistory(history);
    setCurrentStage(AppStage.CLINIC_SELECTION);
  }, []);

  const handleClinicSelected = useCallback((clinic: Clinic) => {
    setSelectedClinic(clinic);
    setCurrentStage(AppStage.BOOKING_CONFIRMATION);
  }, []);

  const handleBookingConfirmed = useCallback((
    appointment: Appointment, 
    updatedProvisionalDiagnosis: ProvisionalDiagnosisResult | null, 
    suggTests: string[],
    reportsData?: string | null
  ) => {
    setAppointmentDetails(appointment); 
    if(updatedProvisionalDiagnosis) setProvisionalDiagnosis(updatedProvisionalDiagnosis); 
    setSuggestedTests(suggTests);
    setUploadedReportsData(reportsData || null);
    setCurrentStage(AppStage.DOCTOR_PATIENT_VIEW);
  }, []);
  
  const completeConsultationAndSaveEpisode = useCallback((finalPrescription?: Prescription) => {
    if (provisionalDiagnosis) {
      const newEpisode: Episode = {
        id: new Date().toISOString() + Math.random().toString(),
        date: new Date().toLocaleDateString(),
        patientName: patientProfile?.name || 'N/A',
        initialSymptomsSummary: initialSymptoms.substring(0, 100) + (initialSymptoms.length > 100 ? '...' : ''),
        provisionalDiagnosisSummary: `Condition: ${provisionalDiagnosis.condition || 'N/A'}, Confidence: ${provisionalDiagnosis.confidence || 'N/A'}`,
        clinicName: selectedClinic?.name,
        prescriptionSummary: finalPrescription ? 
          `Meds: ${finalPrescription.medications.map(m => m.name).join(', ') || 'None'}. Tests: ${finalPrescription.tests.map(t => t.name).join(', ') || 'None'}` 
          : 'N/A',
      };
      const updatedEpisodes = saveEpisode(newEpisode);
      setEpisodes(updatedEpisodes);
    }
    setInitialSymptoms('');
    setChatHistory([]);
    setProvisionalDiagnosis(null);
    setSelectedClinic(null);
    setAppointmentDetails(null);
    setSuggestedTests([]);
    setUploadedReportsData(null);
    setActivePrescriptionForOrders(null);
    setCurrentStage(AppStage.WELCOME);

  }, [initialSymptoms, provisionalDiagnosis, selectedClinic, patientProfile]);

  const handleNavigateToPharmacyOrder = useCallback((prescription: Prescription) => {
    setActivePrescriptionForOrders(prescription);
    setCurrentStage(AppStage.PHARMACY_ORDER_VIEW);
  }, []);

  const handleNavigateToLabOrder = useCallback((prescription: Prescription) => {
    setActivePrescriptionForOrders(prescription);
    setCurrentStage(AppStage.LAB_ORDER_VIEW);
  }, []);

  const handleReturnToDoctorView = useCallback(() => {
    setCurrentStage(AppStage.DOCTOR_PATIENT_VIEW);
  }, []);


  const handleReturnToWelcome = useCallback(() => {
    setInitialSymptoms('');
    setChatHistory([]);
    setProvisionalDiagnosis(null);
    setSelectedClinic(null);
    setAppointmentDetails(null);
    setSuggestedTests([]);
    setUploadedReportsData(null);
    setActivePrescriptionForOrders(null);
    setSelectedBusinessType(null); // Clear business type
    setCurrentStage(AppStage.WELCOME);
  }, []);
  
  const handleBackToSymptoms = useCallback(() => {
    setCurrentStage(AppStage.SYMPTOM_INPUT_CHAT);
  }, []);

  const handleBackToClinicSelection = useCallback(() => {
    setCurrentStage(AppStage.CLINIC_SELECTION);
  }, []);

  const startNewCheck = () => {
     if (patientProfile) {
      setCurrentStage(AppStage.SYMPTOM_INPUT_CHAT);
    } else {
      setCurrentStage(AppStage.PATIENT_PROFILE);
    }
  };

  // Marketplace Handlers
  const handleMarketplaceWelcomeProceed = (businessType: BusinessType) => {
    setSelectedBusinessType(businessType);
    setCurrentStage(AppStage.MARKETPLACE_ONBOARDING_FORM);
  };

  const handleMarketplaceFormSubmit = () => {
    // In a real app, data would be sent to a backend here.
    // For now, just go to confirmation.
    setCurrentStage(AppStage.MARKETPLACE_CONFIRMATION);
  };


  const renderStage = () => {
    switch (currentStage) {
      case AppStage.WELCOME:
        return <WelcomeScreen 
                  onStart={startNewCheck} 
                  onViewHistory={() => setCurrentStage(AppStage.INTERACTION_HISTORY)}
                  onManageProfile={() => setCurrentStage(AppStage.PATIENT_PROFILE)}
                  onGoToMarketplace={() => setCurrentStage(AppStage.MARKETPLACE_WELCOME)} // New
                  hasProfile={!!patientProfile}
                  hasHistory={episodes.length > 0}
                />;
      case AppStage.PATIENT_PROFILE:
        return <PatientProfileStage 
                  initialProfile={patientProfile} 
                  onProfileSaved={handleProfileSaved} 
                  onBackToWelcome={handleReturnToWelcome}
                />;
      case AppStage.SYMPTOM_INPUT_CHAT:
        return <SymptomInputStage 
                  patientProfile={patientProfile} 
                  onNextStage={handleSymptomAnalysisComplete} 
                  initialSymptoms={initialSymptoms} 
                  existingChatHistory={chatHistory} 
               />;
      case AppStage.CLINIC_SELECTION:
        if (!provisionalDiagnosis) { 
          setCurrentStage(AppStage.SYMPTOM_INPUT_CHAT); 
          return null;
        }
        return <ClinicSelectionStage 
                  provisionalDiagnosis={provisionalDiagnosis} 
                  onClinicSelected={handleClinicSelected}
                  onBack={handleBackToSymptoms} 
               />;
      case AppStage.BOOKING_CONFIRMATION:
        if (!selectedClinic || !provisionalDiagnosis) { 
           setCurrentStage(AppStage.CLINIC_SELECTION);
           return null;
        }
        return <BookingStage 
                  clinic={selectedClinic} 
                  provisionalDiagnosis={provisionalDiagnosis}
                  initialSymptoms={initialSymptoms}
                  chatHistory={chatHistory}
                  patientProfile={patientProfile} 
                  onBookingConfirmed={handleBookingConfirmed} 
                  onBack={handleBackToClinicSelection}
               />;
      case AppStage.DOCTOR_PATIENT_VIEW:
        if (!appointmentDetails || !provisionalDiagnosis) { 
           setCurrentStage(AppStage.WELCOME); 
           return null;
        }
        return <DoctorPatientViewStage 
                  appointment={appointmentDetails} 
                  provisionalDiagnosis={provisionalDiagnosis} 
                  initialSymptoms={initialSymptoms}
                  chatHistory={chatHistory}
                  suggestedTests={suggestedTests}
                  uploadedReportsData={uploadedReportsData}
                  patientProfile={patientProfile} 
                  onComplete={completeConsultationAndSaveEpisode}
                  onViewPharmacyOrder={handleNavigateToPharmacyOrder}
                  onViewLabOrder={handleNavigateToLabOrder}
               />;
      case AppStage.INTERACTION_HISTORY:
        return <InteractionHistoryView 
                  episodes={episodes} 
                  onBack={() => setCurrentStage(AppStage.WELCOME)}
                  onClearHistory={() => {
                    saveEpisode(null, true); 
                    setEpisodes([]);
                    setCurrentStage(AppStage.WELCOME);
                  }}
                />;
      case AppStage.PHARMACY_ORDER_VIEW:
        if (!activePrescriptionForOrders || !patientProfile || !appointmentDetails) {
            setCurrentStage(AppStage.DOCTOR_PATIENT_VIEW); 
            return null;
        }
        return <PharmacyOrderView 
                  prescription={activePrescriptionForOrders}
                  patientProfile={patientProfile}
                  appointment={appointmentDetails}
                  onBack={handleReturnToDoctorView}
                />;
      case AppStage.LAB_ORDER_VIEW:
        if (!activePrescriptionForOrders || !patientProfile || !appointmentDetails) {
            setCurrentStage(AppStage.DOCTOR_PATIENT_VIEW); 
            return null;
        }
        return <LabOrderView
                  prescription={activePrescriptionForOrders}
                  patientProfile={patientProfile}
                  appointment={appointmentDetails}
                  onBack={handleReturnToDoctorView}
                />;
      case AppStage.MARKETPLACE_WELCOME: // New
        return <MarketplaceWelcomeStage 
                  onProceed={handleMarketplaceWelcomeProceed}
                  onBackToMainWelcome={handleReturnToWelcome} 
                />;
      case AppStage.MARKETPLACE_ONBOARDING_FORM: // New
        if (!selectedBusinessType) {
          setCurrentStage(AppStage.MARKETPLACE_WELCOME);
          return null;
        }
        return <MarketplaceOnboardingFormStage 
                  businessType={selectedBusinessType}
                  onSubmit={handleMarketplaceFormSubmit}
                  onBack={() => setCurrentStage(AppStage.MARKETPLACE_WELCOME)}
                />;
      case AppStage.MARKETPLACE_CONFIRMATION: // New
        return <MarketplaceConfirmationStage 
                  onFinish={handleReturnToWelcome} 
                />;
      default:
        return <WelcomeScreen 
                  onStart={startNewCheck} 
                  onViewHistory={() => setCurrentStage(AppStage.INTERACTION_HISTORY)}
                  onManageProfile={() => setCurrentStage(AppStage.PATIENT_PROFILE)}
                  onGoToMarketplace={() => setCurrentStage(AppStage.MARKETPLACE_WELCOME)} // New
                  hasProfile={!!patientProfile}
                  hasHistory={episodes.length > 0}
               />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-200 via-sky-100 to-blue-200">
      <div className="container mx-auto">
        {renderStage()}
      </div>
       <footer className="py-4 text-center text-xs text-slate-700 mt-auto">
            Powered by AI | Primary Care Assistant Demo <sup className="text-slate-500">made by greybrain.ai</sup>
      </footer>
    </div>
  );
};

export default App;