import React from 'react';
import { Icons } from '../constants';

interface MarketplaceConfirmationStageProps {
  onFinish: () => void;
}

const MarketplaceConfirmationStage: React.FC<MarketplaceConfirmationStageProps> = ({ onFinish }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg mx-auto text-center">
      <Icons.ChatBubble className="w-16 h-16 text-green-500 mx-auto mb-6" /> {/* Using ChatBubble as placeholder */}
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Application Submitted!</h2>
      <p className="text-slate-600 mb-8">
        Thank you for submitting your application to join our healthcare network.
        Our team will review your details and contact you regarding the next steps.
        <br/><br/>
        (This is a simulated process for demonstration purposes.)
      </p>
      <button
        onClick={onFinish}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        Return to Main Welcome
      </button>
    </div>
  );
};

export default MarketplaceConfirmationStage;