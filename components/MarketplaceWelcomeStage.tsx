
import React from 'react';
import { BusinessType } from '../types';
import { Icons } from '../constants'; // Assuming Icons might be used

interface MarketplaceWelcomeStageProps {
  onProceed: (businessType: BusinessType) => void;
  onBackToMainWelcome: () => void;
}

const MarketplaceWelcomeStage: React.FC<MarketplaceWelcomeStageProps> = ({ onProceed, onBackToMainWelcome }) => {
  const businessTypes = [
    { type: BusinessType.CLINIC, icon: <Icons.ChatBubble className="w-10 h-10 mx-auto mb-2 text-blue-600" />, description: "Manage patient appointments, access pre-consultation insights, and streamline your workflow." },
    { type: BusinessType.LAB, icon: <Icons.Search className="w-10 h-10 mx-auto mb-2 text-purple-600" />, description: "Receive digital test orders, manage results, and connect with referring clinicians." },
    { type: BusinessType.PHARMACY, icon: <Icons.Sparkles className="w-10 h-10 mx-auto mb-2 text-green-600" />, description: "Process e-prescriptions, manage medication dispensing, and engage with patients." },
  ];

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl mx-auto">
      <div className="flex justify-start mb-6">
        <button onClick={onBackToMainWelcome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Primary Care Assistant
        </button>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Join Our Healthcare Network</h2>
        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
          Connect your Clinic, Laboratory, or Pharmacy to our platform to enhance patient care, streamline operations, and expand your reach.
          Select your business type to begin the onboarding process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {businessTypes.map((bt) => (
          <button
            key={bt.type}
            onClick={() => onProceed(bt.type)}
            className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-6 rounded-lg text-center transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {bt.icon}
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{bt.type}</h3>
            <p className="text-xs text-slate-500">{bt.description}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-8">
        The onboarding process is simulated and for demonstration purposes only.
        In a real-world scenario, this would involve verification and adherence to regional healthcare regulations.
      </p>
    </div>
  );
};

export default MarketplaceWelcomeStage;