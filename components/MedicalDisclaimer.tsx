import React, { useState } from 'react';
import { Icons } from '../constants';

interface MedicalDisclaimerProps {
  onAccept: () => void;
  variant?: 'full' | 'compact' | 'banner';
  showAcceptButton?: boolean;
}

const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ 
  onAccept, 
  variant = 'full',
  showAcceptButton = true 
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  if (variant === 'banner') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Icons.AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <strong>Medical Disclaimer:</strong> This system provides AI-assisted suggestions for healthcare professionals only. 
              All medical decisions must be made by licensed healthcare providers. 
              <span className="font-semibold"> Emergency situations require immediate professional medical attention.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <Icons.AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <strong>Professional Use Only:</strong> AI-assisted tool for healthcare professionals. 
            Does not replace medical judgment or patient examination.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Icons.Shield className="h-8 w-8 text-red-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">
              Medical Disclaimer & Terms of Use
            </h3>
          </div>

          {/* Disclaimer Content */}
          <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-6 text-sm">
            <div className="space-y-4">
              <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded">
                <h4 className="font-bold text-red-800 mb-2">⚠️ CRITICAL SAFETY NOTICE</h4>
                <ul className="text-red-700 space-y-1">
                  <li>• <strong>FOR HEALTHCARE PROFESSIONALS ONLY</strong> - This system is designed exclusively for use by licensed healthcare providers</li>
                  <li>• <strong>NOT FOR PATIENT SELF-DIAGNOSIS</strong> - Patients should not use this system for self-diagnosis or treatment decisions</li>
                  <li>• <strong>EMERGENCY SITUATIONS</strong> - Call 911 or seek immediate medical attention for any emergency</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">🤖 AI-Assisted Tool Limitations</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• This system provides <strong>AI-assisted suggestions</strong> to support clinical decision-making</li>
                  <li>• All medical decisions must be made by <strong>licensed healthcare providers</strong></li>
                  <li>• This tool <strong>does not replace</strong> professional medical judgment, clinical examination, or diagnostic testing</li>
                  <li>• AI suggestions should be <strong>validated against clinical guidelines</strong> and professional experience</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">🏥 Scope of Use</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• Designed for use in clinical settings by qualified healthcare professionals</li>
                  <li>• Intended to assist with documentation, differential diagnosis consideration, and treatment planning</li>
                  <li>• Drug interaction checking provides general guidance but requires professional interpretation</li>
                  <li>• Treatment protocols are evidence-based suggestions that must be customized for individual patients</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">⚖️ Legal and Liability Limitations</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• Healthcare providers retain full responsibility for all clinical decisions and patient care</li>
                  <li>• This system does not establish a doctor-patient relationship</li>
                  <li>• Users assume full responsibility for validating AI suggestions against current medical standards</li>
                  <li>• The system developers disclaim liability for clinical outcomes or decisions based on AI suggestions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">🔒 Data Privacy and Security</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• Patient data should be handled in compliance with HIPAA and applicable privacy regulations</li>
                  <li>• Users are responsible for ensuring secure handling of patient information</li>
                  <li>• Do not enter real patient identifiers in demonstration or testing modes</li>
                </ul>
              </div>

              <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded">
                <h4 className="font-bold text-blue-800 mb-2">✅ Best Practices</h4>
                <ul className="text-blue-700 space-y-1">
                  <li>• Always correlate AI suggestions with clinical findings and patient presentation</li>
                  <li>• Use as a supplementary tool alongside established clinical protocols</li>
                  <li>• Maintain current medical knowledge and continuing education</li>
                  <li>• Document clinical reasoning and decision-making process independently</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I have read and understand the medical disclaimer and limitations of this AI-assisted system
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={!hasRead}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                I am a licensed healthcare professional and agree to use this system responsibly within my scope of practice
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          {showAcceptButton && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!hasRead || !accepted}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Accept & Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalDisclaimer;
