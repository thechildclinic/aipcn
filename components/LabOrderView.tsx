import React, { useState, useEffect } from 'react';
import { Prescription, PatientProfile, Appointment, Bid, AlgorithmFactorWeights, LabProvider, TestRecommendation } from '../types';
import { Icons } from '../constants'; 
import LoadingSpinner from './LoadingSpinner';

interface LabOrderViewProps {
  prescription: Prescription;
  patientProfile: PatientProfile;
  appointment: Appointment;
  onBack: () => void;
}

// Mock data - In a real app, this would come from a backend
const mockLabs: Omit<LabProvider, 'id' | 'address' | 'contactEmail' | 'contactPhone' | 'website' | 'serviceRegion' | 'currentCapacity' | 'acceptingNewSamples' | 'testsOffered' | 'certifications'>[] = [
  { name: 'Precision Diagnostics Hub', avgTurnaroundTimeHours: 36, qualityScore: 'A+', averageRating: 4.9 },
  { name: 'Metro Health Labs', avgTurnaroundTimeHours: 48, qualityScore: 'A', averageRating: 4.7 },
  { name: 'SpeedyTest Center', avgTurnaroundTimeHours: 18, qualityScore: 'B+', averageRating: 4.3 },
  { name: 'County Central Laboratory', avgTurnaroundTimeHours: 72, qualityScore: 'A-', averageRating: 4.5 },
];

const generateMockLabBids = (tests: TestRecommendation[]): Bid[] => {
  const basePricePerTest = 40;
  const totalTestEstValue = tests.length * basePricePerTest;

  return mockLabs.map((lab, index) => {
    const priceFluctuation = (Math.random() - 0.5) * 20; // +/- $10 fluctuation per test group
    const offerPrice = Math.max(25, totalTestEstValue + priceFluctuation - (lab.averageRating || 4) * 5 + (lab.avgTurnaroundTimeHours || 48) / 12);
    
    return {
      id: `bid_lab_${index + 1}`,
      orderId: 'mock_lab_order_456',
      providerId: `lab_id_${index + 1}`,
      providerName: lab.name,
      bidAmount: parseFloat(offerPrice.toFixed(2)),
      estimatedTurnaroundTime: `${lab.avgTurnaroundTimeHours} hrs`,
      timestamp: new Date().toISOString(),
      qualityMetrics: {
        rating: lab.averageRating,
        qualityScore: lab.qualityScore,
      }
    };
  });
};

const testJourneySteps = [
  "Broadcasting test order to partner labs...",
  "Evaluating lab proposals based on your preferences...",
  "Order assigned to [Winning Lab Name]!",
  "AI generating pre-test instructions based on ordered tests...",
  "Pre-test instructions available. Please review below.",
  "Sample collection scheduled: [Details]", 
  "Sample received at [Winning Lab Name].",
  "Analysis in progress by [Winning Lab Name].",
  "Results submitted to Doctor [Doctor's Name].",
  "AI generating result summary for doctor review (Conceptual).",
  "Doctor [Doctor's Name] is reviewing your results and summary.",
  "Final results & advice are being prepared by your doctor."
];


const LabOrderView: React.FC<LabOrderViewProps> = ({ prescription, patientProfile, appointment, onBack }) => {
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [winningLabBid, setWinningLabBid] = useState<Bid | null>(null);
  const [currentTestStep, setCurrentTestStep] = useState(0);
  const [preTestInstructions, setPreTestInstructions] = useState<string | null>(null);
  const [isOrderFinalized, setIsOrderFinalized] = useState(false);

  const [algorithmFactors, setAlgorithmFactors] = useState<AlgorithmFactorWeights>({
    priceWeight: 0.5,
    speedWeight: 0.3, // Turnaround Time
    qualityWeight: 0.2, // Quality Score / Rating
  });

  const orderDate = new Date(appointment.dateTime).toLocaleDateString();

  useEffect(() => {
    setCurrentTestStep(0); // Broadcasting
    const bidsTimer = setTimeout(() => {
      const generatedBids = generateMockLabBids(prescription.tests);
      setBids(generatedBids);
      setIsLoadingBids(false);
      setCurrentTestStep(1); // Evaluating proposals
    }, 2000);

    return () => clearTimeout(bidsTimer);
  }, [prescription.tests]);

  useEffect(() => {
    if (!isLoadingBids && bids.length > 0 && currentTestStep === 1) {
      const evaluateTimer = setTimeout(() => {
        const minPrice = Math.min(...bids.map(b => b.bidAmount));
        const maxPrice = Math.max(...bids.map(b => b.bidAmount));
        const turnaroundToNumeric = (tt: string | undefined) => tt ? parseInt(tt.replace(' hrs','')) : 96;
        const turnarounds = bids.map(b => turnaroundToNumeric(b.estimatedTurnaroundTime));
        const minTurnaround = Math.min(...turnarounds);
        const maxTurnaround = Math.max(...turnarounds);
        
        const qualityScoreToNumeric = (qs: string | undefined) => {
            if (!qs) return 3;
            if (qs.includes('A+')) return 5;
            if (qs.includes('A')) return 4;
            if (qs.includes('B+')) return 3.5;
            if (qs.includes('B')) return 3;
            return 2;
        };

        const scoredBids = bids.map((bid, index) => {
          const normPrice = maxPrice === minPrice ? 1 : 1 - (bid.bidAmount - minPrice) / (maxPrice - minPrice);
          const normSpeed = maxTurnaround === minTurnaround ? 1 : 1 - (turnarounds[index] - minTurnaround) / (maxTurnaround - minTurnaround);
          const normQuality = qualityScoreToNumeric(bid.qualityMetrics?.qualityScore) / 5;

          const score = (normPrice * algorithmFactors.priceWeight) +
                        (normSpeed * algorithmFactors.speedWeight) +
                        (normQuality * algorithmFactors.qualityWeight);
          return { ...bid, score };
        });
        
        const sortedBids = scoredBids.sort((a, b) => b.score - a.score);
        setWinningLabBid(sortedBids[0]);
        setCurrentTestStep(2); // Order assigned
      }, 1800);
      return () => clearTimeout(evaluateTimer);
    }
  }, [isLoadingBids, bids, algorithmFactors, currentTestStep]);


  useEffect(() => {
    if (winningLabBid && currentTestStep === 2) { // After lab assignment, "generate" instructions
      setCurrentTestStep(3); // "AI generating instructions"
      const instructionTimer = setTimeout(() => {
        let instructions = "AI Generated Pre-Test Instructions (Conceptual Example):\n\n";
        prescription.tests.forEach(test => {
          instructions += `For your '${test.name}':\n`;
          if (test.name.toLowerCase().includes("blood") || test.name.toLowerCase().includes("cbc") || test.name.toLowerCase().includes("panel")) {
            instructions += `  - If fasting is indicated by your doctor, please avoid food and drinks (except water) for 8-12 hours prior.\n`;
            instructions += `  - Ensure you are well-hydrated by drinking water.\n`;
            instructions += `  - Wear clothing with sleeves that can be easily rolled up.\n`;
          } else if (test.name.toLowerCase().includes("urine")) {
            instructions += `  - You may be given a special collection kit. Follow instructions carefully.\n`;
            instructions += `  - For a 'clean catch' or 'mid-stream' sample, ensure you clean the area first.\n`;
          } else if (test.name.toLowerCase().includes("imaging") || test.name.toLowerCase().includes("x-ray") || test.name.toLowerCase().includes("mri")) {
            instructions += `  - Remove any metallic objects or jewelry before the test.\n`;
            instructions += `  - Inform the technician if you have any implants or are pregnant.\n`;
          } else {
            instructions += `  - General: Follow any specific instructions provided by the lab or your doctor. List all medications you are currently taking.\n`;
          }
          instructions += `  - Reason: ${test.reason || 'As per doctor recommendation.'}\n\n`;
        });
        instructions += "Please Note: These are general guidelines. Always confirm specific preparation instructions with the assigned lab or your doctor.";
        setPreTestInstructions(instructions);
        setCurrentTestStep(4); // "Instructions available"
      }, 1500);
      return () => clearTimeout(instructionTimer);
    }
  }, [winningLabBid, currentTestStep, prescription.tests]);
  
  useEffect(() => {
    if (currentTestStep >= 4 && currentTestStep < testJourneySteps.length - 1 && !isOrderFinalized) {
      const stepTimer = setTimeout(() => {
        setCurrentTestStep(prev => prev + 1);
      }, 3500 + Math.random() * 2500);
      return () => clearTimeout(stepTimer);
    }
    if (currentTestStep === testJourneySteps.length -1) {
        setIsOrderFinalized(true);
    }
  }, [currentTestStep, isOrderFinalized]);


  const getStepText = (stepIndex: number): string => {
    let text = testJourneySteps[stepIndex];
    if (winningLabBid) {
      text = text.replace(/\[Winning Lab Name]/g, winningLabBid.providerName);
    }
    text = text.replace(/\[Doctor's Name]/g, prescription.doctorName || "Your Doctor");
    if (stepIndex === 5 && winningLabBid) { 
        const collectionDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString();
        const collectionTime = "10:30 AM";
        text = text.replace("[Details]", `Appointment at ${winningLabBid.providerName} on ${collectionDate} at ${collectionTime} (simulated).`);
    }
    return text;
  };
  
  const factorDisplay = (
    <div className="text-xs text-slate-600 mt-1">
      (Simulated factors: Price {algorithmFactors.priceWeight*100}%, 
      Turnaround {algorithmFactors.speedWeight*100}%, 
      Quality {algorithmFactors.qualityWeight*100}%)
    </div>
  );


  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Laboratory Test Order & Process</h2>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Consultation
        </button>
      </div>

       <details className="mb-4">
        <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600">View Patient & Clinician Details</summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs bg-slate-50 p-3 rounded-lg border">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Patient Information</h3>
            <p><strong>Name:</strong> {patientProfile.name || 'N/A'}</p>
            <p><strong>Age:</strong> {patientProfile.age || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Requesting Clinician</h3>
            <p><strong>Doctor:</strong> {prescription.doctorName || appointment.clinic.doctorName || 'N/A'}</p>
            <p><strong>Order Date:</strong> {orderDate}</p>
          </div>
        </div>
      </details>
      
      {/* Conceptual Algorithm Settings Display */}
      <div className="my-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-700 mb-1">Conceptual Algorithm Settings (Simulation)</h4>
          <div className="text-xs text-indigo-600 space-y-0.5">
              <p>Price Weight: <span className="font-medium">{(algorithmFactors.priceWeight * 100).toFixed(0)}%</span></p>
              <p>Turnaround Time Weight: <span className="font-medium">{(algorithmFactors.speedWeight * 100).toFixed(0)}%</span></p>
              <p>Quality Score Weight: <span className="font-medium">{(algorithmFactors.qualityWeight * 100).toFixed(0)}%</span></p>
          </div>
          <p className="text-xs text-indigo-500 mt-1">These factors guide lab selection in this simulation.</p>
      </div>


      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center">
            <Icons.Search className="w-5 h-5 mr-2 text-purple-600" />
            Lab Assignment (Conceptual Simulation)
        </h3>
        {(isLoadingBids || (currentTestStep === 1 && bids.length > 0)) && <LoadingSpinner text={getStepText(currentTestStep)} size="sm" />}
        {!isLoadingBids && winningLabBid && currentTestStep >=2 && (
            <div className="text-sm space-y-1">
                <p><strong>Assigned Lab:</strong> <span className="font-semibold text-purple-800">{winningLabBid.providerName}</span></p>
                <p><strong>Offer Price:</strong> ${winningLabBid.bidAmount.toFixed(2)}</p>
                <p><strong>Est. Turnaround:</strong> {winningLabBid.estimatedTurnaroundTime}</p>
                <p><strong>Quality (Simulated):</strong> Rating {winningLabBid.qualityMetrics?.rating}/5, Score {winningLabBid.qualityMetrics?.qualityScore}</p>
                <p className="text-xs text-purple-700">Selected based on a score of <span className="font-medium">{(winningLabBid as any).score?.toFixed(2) || 'N/A'}</span>. {factorDisplay}</p>
            </div>
        )}
        {!isLoadingBids && currentTestStep < 2 && bids.length === 0 && !winningLabBid &&<p className="text-sm text-slate-500">Could not assign a lab at this time (simulation error).</p>}
        <p className="text-xs text-purple-600 mt-2">This panel simulates finding and assigning the best lab based on weighted factors.</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Tests Requested</h3>
        {prescription.tests && prescription.tests.length > 0 ? (
          <div className="space-y-3">
            {prescription.tests.map((test, index) => (
              <div key={index} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                <p className="font-semibold text-md text-slate-800">{test.name}</p>
                {test.reason && <p className="text-sm text-slate-600"><strong>Reason/Clinical Indication:</strong> {test.reason}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No specific tests listed on this order.</p>
        )}
      </div>

      {currentTestStep >= 3 && ( // Start showing journey after assignment
        <div className="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <h3 className="text-lg font-semibold text-sky-700 mb-3">Your Test Journey (Conceptual)</h3>
            
            {preTestInstructions && currentTestStep >=4 && ( // Show instructions once "available"
                 <details className="mb-3 group" open={currentTestStep === 4}>
                    <summary className="text-sm font-medium text-sky-800 cursor-pointer hover:underline group-open:pb-2">
                        {currentTestStep === 4 ? "Please Review: Pre-Test Instructions" : "View Pre-Test Instructions"}
                    </summary>
                    <div className="p-3 mt-1 bg-white border border-sky-300 rounded-md text-xs text-slate-700 whitespace-pre-wrap custom-scrollbar max-h-48 overflow-y-auto">
                        {preTestInstructions}
                    </div>
                </details>
            )}
            
            <div className="mt-2 text-sm">
                 <h4 className="font-medium text-sky-700 mb-2">Progress:</h4>
                 <div className="flex items-center">
                    {(!isOrderFinalized && currentTestStep !== 3 && currentTestStep >=2) && <LoadingSpinner size="sm"/>}
                     <p className={`ml-2 font-semibold ${isOrderFinalized ? 'text-green-700' : 'text-sky-700'}`}>
                        {getStepText(currentTestStep)}
                     </p>
                 </div>
            </div>
             <p className="text-xs text-sky-600 mt-3">Track the progress of your lab tests here. Updates are simulated.</p>
        </div>
      )}

        <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-300 text-center">
            <h3 className="text-md font-semibold text-slate-700 mb-2">Lab Actions (Conceptual - For Lab Use)</h3>
            <button disabled className="bg-slate-300 text-slate-600 py-2 px-4 rounded-lg text-sm cursor-not-allowed mb-2">
                Upload PDF Results (Lab Portal)
            </button>
            <p className="text-xs text-slate-500">
                Labs would upload results here. AI would (conceptually) perform OCR and generate an initial analysis for the doctor's review.
            </p>
        </div>
      
      <p className="text-xs text-slate-500 mt-8 text-center">
        This is a simulated view. In a real system, labs would bid/be assigned, and instructions would be official.
      </p>
    </div>
  );
};

export default LabOrderView;