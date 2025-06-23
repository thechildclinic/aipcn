
import React, { useState, useEffect } from 'react';
import { Clinic, Appointment, AppStage, ProvisionalDiagnosisResult, ChatMessage, PatientProfile } from '../types'; // Added PatientProfile
import { suggestTestsBasedOnCondition, refineDiagnosisWithTestResults } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import { Icons } from '../constants';

interface BookingStageProps {
  clinic: Clinic;
  provisionalDiagnosis: ProvisionalDiagnosisResult;
  initialSymptoms: string;
  chatHistory: ChatMessage[];
  patientProfile: PatientProfile | null; // Added patientProfile
  onBookingConfirmed: (appointment: Appointment, updatedProvisionalDiagnosis: ProvisionalDiagnosisResult | null, suggestedTests: string[], uploadedReportsData?: string | null) => void;
  onBack: () => void;
}

const BookingStage: React.FC<BookingStageProps> = ({ clinic, provisionalDiagnosis, initialSymptoms, chatHistory, patientProfile, onBookingConfirmed, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<{title: string, body: React.ReactNode, footer?: React.ReactNode}>({title: '', body: ''});
  const [uploadedReportsData, setUploadedReportsData] = useState<string | null>(null);
  const [currentProvisionalDiagnosis, setCurrentProvisionalDiagnosis] = useState<ProvisionalDiagnosisResult>(provisionalDiagnosis);

  useEffect(() => {
    const fetchSuggestedTests = async () => {
      if (currentProvisionalDiagnosis.condition) {
        setIsLoading(true);
        const tests = await suggestTestsBasedOnCondition(currentProvisionalDiagnosis.condition);
        setSuggestedTests(tests || []);
        setIsLoading(false);
      }
    };
    fetchSuggestedTests();
  }, [currentProvisionalDiagnosis.condition]);

  const handleBooking = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate booking
    await new Promise(resolve => setTimeout(resolve, 1000));

    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const appointment: Appointment = {
      clinic,
      dateTime: appointmentDateTime,
      patientSymptoms: initialSymptoms, 
      provisionalDiagnosis: currentProvisionalDiagnosis.condition,
      patientProfile: patientProfile || undefined, // Included patientProfile
    };

    setIsLoading(false);
    setModalContent({
      title: "Appointment Requested",
      body: (
        <div>
          <p className="text-slate-700 mb-2">Your appointment request for <span className="font-semibold">{clinic.name}</span> on <span className="font-semibold">{appointmentDateTime.toLocaleDateString()} at {appointmentDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> has been submitted.</p>
          {suggestedTests.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-1 flex items-center"><Icons.InformationCircle className="w-5 h-5 mr-2 text-blue-700"/> Suggested Pre-consultation Tests:</h4>
              <p className="text-sm text-blue-700 mb-2">To help your doctor and potentially save time during your consultation, you might consider discussing these tests with a nurse or getting them done if feasible:</p>
              <ul className="list-disc list-inside text-sm text-blue-700">
                {suggestedTests.map(test => <li key={test}>{test}</li>)}
              </ul>
              <p className="text-xs text-blue-600 mt-2">A nurse from the clinic may call you to discuss these. This is optional.</p>
            </div>
          )}
           <p className="mt-3 text-sm text-slate-600">You will receive a confirmation and reminder shortly (simulated).</p>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => { setIsModalOpen(false); onBookingConfirmed(appointment, currentProvisionalDiagnosis, suggestedTests, uploadedReportsData); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Okay, Got it!
          </button>
        </div>
      )
    });
    setIsModalOpen(true);
  };

  const handleReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      // Simulate file reading and processing
      const reader = new FileReader();
      reader.onload = async (e) => {
        const textContent = e.target?.result as string;
        setUploadedReportsData(textContent); // Store simplified text content
        
        if (currentProvisionalDiagnosis.condition) {
          // Pass patientProfile to refineDiagnosisWithTestResults
          const refinedDiagnosis = await refineDiagnosisWithTestResults(currentProvisionalDiagnosis.condition, textContent, patientProfile || undefined);
          if (refinedDiagnosis) {
            setCurrentProvisionalDiagnosis(refinedDiagnosis); // Update diagnosis based on reports
             setModalContent({
                title: "Test Reports Uploaded",
                body: <p>Your test reports have been uploaded (simulated). The provisional assessment has been updated: <strong className="text-blue-600">{refinedDiagnosis.condition || "N/A"}</strong>. This will be shared with your doctor.</p>,
                footer: <button onClick={() => setIsModalOpen(false)} className="bg-blue-500 text-white px-3 py-1 rounded">Close</button>
            });
          } else {
             setModalContent({
                title: "Test Reports Uploaded",
                body: <p>Your test reports have been uploaded (simulated). We couldn't automatically refine the assessment, but the doctor will review them.</p>,
                footer: <button onClick={() => setIsModalOpen(false)} className="bg-blue-500 text-white px-3 py-1 rounded">Close</button>
            });
          }
          setIsModalOpen(true);
        }
        setIsLoading(false);
      };
      reader.readAsText(file);
      setError(null);
    } else {
        setError("Failed to upload report.");
        setIsLoading(false);
    }
  };


  const availableTimes = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30"];

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800 text-sm">&larr; Change Clinic</button>
      <h2 className="text-2xl font-semibold text-slate-700 mb-1 text-center">Book Appointment</h2>
      <p className="text-center text-slate-600 mb-4">You are booking with: <strong className="text-blue-600">{clinic.name}</strong></p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="appointment-date" className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
          <input
            type="date"
            id="appointment-date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]} // Today onwards
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="appointment-time" className="block text-sm font-medium text-slate-700 mb-1">Select Time Slot</label>
          <select
            id="appointment-time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {availableTimes.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>

        {/* Simulated Test Report Upload */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-2">Upload Test Reports (Optional)</h4>
          <p className="text-sm text-slate-600 mb-2">If you have any relevant test reports (e.g., blood work, imaging summary), you can upload them here. This is a simplified text upload for demo.</p>
          <input 
            type="file" 
            accept=".txt,.pdf,.md" // Simplified
            onChange={handleReportUpload}
            className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadedReportsData && <p className="text-green-600 text-sm mt-2">Report uploaded (simulated). Doctor will review.</p>}
        </div>

        {isLoading && <LoadingSpinner text="Processing..." />}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleBooking}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow hover:shadow-md flex items-center justify-center"
        >
          <Icons.Calendar className="w-5 h-5 mr-2" />
          Request Appointment
        </button>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title} footer={modalContent.footer}>
        {modalContent.body}
      </Modal>
    </div>
  );
};

export default BookingStage;
