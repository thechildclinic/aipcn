import React, { useState, useEffect, useMemo } from 'react';
import { Prescription, PatientProfile, Appointment, Bid, AlgorithmFactorWeights, PharmacyProvider, Medication } from '../types'; // Added Medication
import { Icons } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface PharmacyOrderViewProps {
  prescription: Prescription;
  patientProfile: PatientProfile;
  appointment: Appointment;
  onBack: () => void;
}

// Mock data - In a real app, this would come from a backend
const mockPharmacies: Omit<PharmacyProvider, 'id' | 'address' | 'contactEmail' | 'contactPhone' | 'website' | 'serviceRegion' | 'currentBidCapacity' | 'acceptingNewOrders' | 'servicesOffered'>[] = [
  { name: 'Community Care Pharmacy', offersDelivery: true, averageRating: 4.8, slaCompliance: 98 },
  { name: 'QuickMeds Downtown', offersDelivery: true, averageRating: 4.5, slaCompliance: 95 },
  { name: 'HealthFirst Dispensary', offersDelivery: false, averageRating: 4.9, slaCompliance: 99 },
  { name: 'Value Pharmacy Plus', offersDelivery: true, averageRating: 4.2, slaCompliance: 92 },
];

const generateMockBids = (medications: Medication[]): Bid[] => {
  const basePricePerMed = 15; // Average base price per medication
  const totalMedicationEstValue = medications.length * basePricePerMed;

  return mockPharmacies.map((pharm, index) => {
    const priceFluctuation = (Math.random() - 0.5) * 10; // +/- $5 fluctuation per med
    const offerPrice = Math.max(10, totalMedicationEstValue + priceFluctuation - (pharm.averageRating || 4) * 2 + (100 - (pharm.slaCompliance || 90))/5 );
    
    let deliveryTime = "2-3 days";
    if (pharm.offersDelivery) {
        if (pharm.name.includes("QuickMeds")) deliveryTime = "Today PM (Express)";
        else if (pharm.slaCompliance && pharm.slaCompliance > 96) deliveryTime = "Tomorrow AM";
    } else {
        deliveryTime = "Pickup Only";
    }

    return {
      id: `bid_pharm_${index + 1}`,
      orderId: 'mock_order_123',
      providerId: `pharm_id_${index + 1}`,
      providerName: pharm.name,
      bidAmount: parseFloat(offerPrice.toFixed(2)),
      estimatedDeliveryTime: deliveryTime,
      timestamp: new Date().toISOString(),
      qualityMetrics: {
        rating: pharm.averageRating,
        sla: pharm.slaCompliance,
      }
    };
  });
};


const fulfillmentSteps = [
  "Broadcasting prescription to pharmacy network...",
  "Evaluating offers based on your preferences...",
  "Order assigned to [Winning Pharmacy Name]!",
  "Medications being prepared by [Winning Pharmacy Name]...",
  "Packed and ready for dispatch.",
  "Out for delivery - Est. arrival: [Time]", // For delivery
  "Ready for pickup at [Winning Pharmacy Name]. Collection by [Time]." // For pickup
];


const PharmacyOrderView: React.FC<PharmacyOrderViewProps> = ({ prescription, patientProfile, appointment, onBack }) => {
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [winningBid, setWinningBid] = useState<Bid | null>(null);
  const [currentFulfillmentStep, setCurrentFulfillmentStep] = useState(0);
  const [estimatedTotalSavings, setEstimatedTotalSavings] = useState<number | null>(null);
  const [isOrderFinalized, setIsOrderFinalized] = useState(false);

  // Conceptual Algorithm Factors
  const [algorithmFactors, setAlgorithmFactors] = useState<AlgorithmFactorWeights>({
    priceWeight: 0.6, // 60%
    speedWeight: 0.2, // 20%
    qualityWeight: 0.2, // 20%
  });

  const prescriptionDate = new Date(appointment.dateTime).toLocaleDateString();

  useEffect(() => {
    // Simulate fetching bids
    setCurrentFulfillmentStep(0); // Broadcasting
    const bidsTimer = setTimeout(() => {
      const generatedBids = generateMockBids(prescription.medications);
      setBids(generatedBids);
      setIsLoadingBids(false);
      setCurrentFulfillmentStep(1); // Evaluating offers
    }, 2000); 

    return () => clearTimeout(bidsTimer);
  }, [prescription.medications]);


  // Simulate evaluating bids and selecting a winner
  useEffect(() => {
    if (!isLoadingBids && bids.length > 0 && currentFulfillmentStep === 1) {
      const evaluateTimer = setTimeout(() => {
        // Normalize bids for scoring (simple example)
        const minPrice = Math.min(...bids.map(b => b.bidAmount));
        const maxPrice = Math.max(...bids.map(b => b.bidAmount));
        // Speed: Lower numbers are better (e.g., Today PM = 1, Tomorrow AM = 2, 2-3 days = 3)
        const deliverySpeedToScore = (delivery: string | undefined): number => {
            if (!delivery) return 5;
            if (delivery.includes("Today")) return 1;
            if (delivery.includes("Tomorrow")) return 2;
            if (delivery.includes("Pickup Only")) return 4; // Less convenient generally
            return 3; // Default for "2-3 days"
        };
        const speeds = bids.map(b => deliverySpeedToScore(b.estimatedDeliveryTime));
        const minSpeedScore = Math.min(...speeds);
        const maxSpeedScore = Math.max(...speeds);

        const maxRating = 5; // Assuming rating is 0-5

        const scoredBids = bids.map((bid, index) => {
          const normPrice = maxPrice === minPrice ? 1 : 1 - (bid.bidAmount - minPrice) / (maxPrice - minPrice);
          const normSpeed = maxSpeedScore === minSpeedScore ? 1 : 1 - (speeds[index] - minSpeedScore) / (maxSpeedScore - minSpeedScore);
          const normQuality = (bid.qualityMetrics?.rating || 3) / maxRating;

          const score = (normPrice * algorithmFactors.priceWeight) +
                        (normSpeed * algorithmFactors.speedWeight) +
                        (normQuality * algorithmFactors.qualityWeight);
          return { ...bid, score };
        });

        const sortedBids = scoredBids.sort((a, b) => b.score - a.score);
        const winner = sortedBids[0];
        setWinningBid(winner);

        const avgRetailPrice = winner.bidAmount * 1.18; // Simulate avg retail is 18% higher
        setEstimatedTotalSavings(+(avgRetailPrice - winner.bidAmount).toFixed(2));
        
        setCurrentFulfillmentStep(2); // Order assigned
      }, 2000);
       return () => clearTimeout(evaluateTimer);
    }
  }, [isLoadingBids, bids, algorithmFactors, currentFulfillmentStep]);

  // Simulate fulfillment steps progression
  useEffect(() => {
    if (winningBid && currentFulfillmentStep >= 2 && !isOrderFinalized) {
      const isDeliveryOrder = winningBid.estimatedDeliveryTime !== "Pickup Only";
      const finalStepForOrderType = isDeliveryOrder ? 5 : 6; // "Delivered" vs "Ready for pickup"

      if (currentFulfillmentStep >= finalStepForOrderType) {
         setIsOrderFinalized(true);
         return; // Stop further progression
      }
      
      // Skip irrelevant step
      let nextStep = currentFulfillmentStep + 1;
      if (isDeliveryOrder && nextStep === 6) nextStep = currentFulfillmentStep; // Already handled by finalStepForOrderType
      if (!isDeliveryOrder && nextStep === 5) nextStep++; // Skip "Out for delivery" for pickup orders
      
      if (nextStep === currentFulfillmentStep) return; // No change

      const stepTimer = setTimeout(() => {
        setCurrentFulfillmentStep(nextStep);
      }, 3000 + Math.random() * 2000);
      return () => clearTimeout(stepTimer);
    }
  }, [currentFulfillmentStep, winningBid, isOrderFinalized]);


  const getStepText = (stepIndex: number): string => {
    let text = fulfillmentSteps[stepIndex];
    if (winningBid) {
      text = text.replace(/\[Winning Pharmacy Name]/g, winningBid.providerName);
    }
    if (stepIndex === 5 && winningBid?.estimatedDeliveryTime?.includes("Today")) { // Out for delivery - delivery
      const arrival = new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      text = text.replace("[Time]", arrival);
    } else if (stepIndex === 5) {
      text = text.replace("[Time]", "in 1-2 hours");
    }
    if (stepIndex === 6) { // Ready for pickup
      const pickupTime = new Date(Date.now() + 1 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
       text = text.replace("[Time]", `around ${pickupTime}`);
    }
    return text;
  };

  const factorDisplay = (
    <div className="text-xs text-slate-600 mt-1">
      (Simulated factors: Price {algorithmFactors.priceWeight*100}%, 
      Speed {algorithmFactors.speedWeight*100}%, 
      Quality {algorithmFactors.qualityWeight*100}%)
    </div>
  );


  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Pharmacy Order & Fulfillment</h2>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Consultation
        </button>
      </div>

      <details className="mb-4">
        <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600">View Patient & Prescriber Details</summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs bg-slate-50 p-3 rounded-lg border">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Patient Information</h3>
            <p><strong>Name:</strong> {patientProfile.name || 'N/A'}</p>
            <p><strong>Age:</strong> {patientProfile.age || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Prescriber Information</h3>
            <p><strong>Doctor:</strong> {prescription.doctorName || appointment.clinic.doctorName || 'N/A'}</p>
            <p><strong>Clinic:</strong> {appointment.clinic.name}</p>
            <p><strong>Date:</strong> {prescriptionDate}</p>
          </div>
        </div>
      </details>
      
      {/* Conceptual Algorithm Settings Display */}
      <div className="my-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-700 mb-1">Conceptual Algorithm Settings (Simulation)</h4>
          <div className="text-xs text-indigo-600 space-y-0.5">
              <p>Price Weight: <span className="font-medium">{(algorithmFactors.priceWeight * 100).toFixed(0)}%</span></p>
              <p>Delivery Speed Weight: <span className="font-medium">{(algorithmFactors.speedWeight * 100).toFixed(0)}%</span></p>
              <p>Quality Rating Weight: <span className="font-medium">{(algorithmFactors.qualityWeight * 100).toFixed(0)}%</span></p>
          </div>
          <p className="text-xs text-indigo-500 mt-1">These factors (conceptually set by patient/admin) guide pharmacy selection.</p>
      </div>


      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
          <Icons.Sparkles className="w-5 h-5 mr-2 text-blue-600"/>
          Order Fulfillment (Conceptual Simulation)
        </h3>
        {(isLoadingBids || (currentFulfillmentStep === 1 && bids.length > 0)) && <LoadingSpinner text={getStepText(currentFulfillmentStep)} size="sm" />}
        
        {!isLoadingBids && winningBid && currentFulfillmentStep >= 2 && (
          <div className="space-y-2 text-sm">
            <p><strong>Winning Offer From:</strong> <span className="font-semibold text-blue-800">{winningBid.providerName}</span></p>
            <p><strong>Offer Price:</strong> <span className="font-bold text-green-600">${winningBid.bidAmount.toFixed(2)}</span> (Delivery: {winningBid.estimatedDeliveryTime})</p>
            <p className="text-xs text-blue-700">Selected based on a score of <span className="font-medium">{(winningBid as any).score?.toFixed(2) || 'N/A'}</span>. {factorDisplay}</p>
            {estimatedTotalSavings !== null && <p className="text-green-700">Estimated Savings: <span className="font-bold">${estimatedTotalSavings.toFixed(2)}</span> (vs. average retail)</p>}
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">Live Status:</h4>
              <div className="flex items-center">
                {(!isOrderFinalized && currentFulfillmentStep >=2) && <LoadingSpinner size="sm" />}
                <p className={`ml-2 font-semibold ${isOrderFinalized ? 'text-green-700' : 'text-blue-700'}`}>
                  {getStepText(currentFulfillmentStep)}
                </p>
              </div>
              {currentFulfillmentStep === 5 && winningBid.estimatedDeliveryTime !== "Pickup Only" && !isOrderFinalized && (
                <button disabled className="mt-2 text-xs bg-slate-200 text-slate-500 py-1 px-3 rounded-full">
                  Track Delivery on Map (Simulated)
                </button>
              )}
            </div>
          </div>
        )}
        {!isLoadingBids && currentFulfillmentStep < 2 && bids.length === 0 && !winningBid && <p className="text-sm text-slate-500">Could not find pharmacy offers at this time (simulation error).</p>}
        <p className="text-xs text-blue-600 mt-3">This panel simulates real-time bidding and order tracking based on weighted factors.</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Medications Prescribed</h3>
        {prescription.medications && prescription.medications.length > 0 ? (
          <div className="space-y-3">
            {prescription.medications.map((med, index) => (
              <div key={index} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                <p className="font-semibold text-md text-slate-800">{med.name}</p>
                <p className="text-sm text-slate-600"><strong>Dosage:</strong> {med.dosage}</p>
                <p className="text-sm text-slate-600"><strong>Instructions:</strong> {med.instructions}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No medications listed on this prescription.</p>
        )}
      </div>
      
      {isOrderFinalized && prescription.medications && prescription.medications.length > 0 && (
         <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-700 mb-3">Refill Options (Conceptual)</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button disabled className="flex-1 bg-slate-300 text-slate-600 py-2 px-4 rounded-lg text-sm cursor-not-allowed">
              Request Refill with {winningBid?.providerName || 'Assigned Pharmacy'}
            </button>
            <button disabled className="flex-1 bg-slate-300 text-slate-600 py-2 px-4 rounded-lg text-sm cursor-not-allowed">
              Request Refill from Pharmacy Pool (Get New Offers)
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">Refill management features would be enabled here in a full system.</p>
        </div>
      )}

       <p className="text-xs text-slate-500 mt-8 text-center">
        This is a simulated view. In a real system, pharmacies would bid, and selection would be automated by backend logic.
      </p>
    </div>
  );
};

export default PharmacyOrderView;
