import React, { useState } from 'react';
import { Icons } from '../constants';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  userType: 'doctor' | 'pharmacist' | 'lab' | 'all';
  actionRequired?: string;
  tips?: string[];
}

interface InteractiveTutorialProps {
  userType: 'doctor' | 'pharmacist' | 'lab' | 'all';
  onComplete: () => void;
  onSkip: () => void;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ 
  userType, 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const tutorialSteps: TutorialStep[] = [
    // Universal Steps
    {
      id: 'welcome',
      title: 'Welcome to AIPC',
      content: 'AIPC is an AI-assisted clinical decision support system designed to help healthcare professionals provide better patient care through intelligent recommendations and safety checking.',
      userType: 'all',
      tips: [
        'Always verify AI suggestions with your clinical judgment',
        'Use as a supplementary tool, not a replacement for expertise',
        'Emergency situations require immediate professional attention'
      ]
    },
    {
      id: 'disclaimer',
      title: 'Important Safety Information',
      content: 'This system provides AI-assisted suggestions for healthcare professionals only. All medical decisions must be made by licensed healthcare providers. The system does not replace professional medical judgment.',
      userType: 'all',
      actionRequired: 'Please acknowledge that you understand these limitations'
    },

    // Doctor-Specific Steps
    {
      id: 'doctor-symptom-checker',
      title: 'AI-Powered Symptom Assessment',
      content: 'Start by entering patient symptoms. The AI will provide specialty-aware provisional diagnosis and ask relevant follow-up questions to gather more information.',
      userType: 'doctor',
      tips: [
        'Be specific with symptom descriptions',
        'Include timeline and severity information',
        'The AI adapts based on your clinic specialty'
      ]
    },
    {
      id: 'doctor-notes',
      title: 'Enhanced Note-Taking',
      content: 'Use the smart note-taking features including contextual autocomplete, smart suggestions, and automated note summarization to improve documentation efficiency.',
      userType: 'doctor',
      actionRequired: 'Try typing in the notes area to see autocomplete suggestions',
      tips: [
        'Press Tab to accept autocomplete suggestions',
        'Use the "Summarize Notes" button for structured output',
        'Smart suggestions appear based on your current text'
      ]
    },
    {
      id: 'doctor-diagnosis',
      title: 'Differential Diagnosis Support',
      content: 'The system provides specialty-specific differential diagnoses with confidence levels and recommended next steps based on current evidence and guidelines.',
      userType: 'doctor',
      tips: [
        'Review all suggested differentials carefully',
        'Consider patient-specific factors not captured by AI',
        'Use as a starting point for clinical reasoning'
      ]
    },
    {
      id: 'doctor-treatment',
      title: 'Automated Treatment Planning',
      content: 'Once you confirm a diagnosis, the system generates evidence-based treatment protocols including medications, diagnostic tests, and monitoring schedules.',
      userType: 'doctor',
      actionRequired: 'Review and approve all AI-generated treatment recommendations',
      tips: [
        'Customize protocols for individual patients',
        'Check for drug interactions and contraindications',
        'Verify dosing for patient age and weight'
      ]
    },
    {
      id: 'doctor-prescription',
      title: 'Safe Prescription Generation',
      content: 'The system performs comprehensive drug interaction checking, provides dosing recommendations, and generates complete prescriptions with patient education.',
      userType: 'doctor',
      tips: [
        'Review all interaction warnings carefully',
        'Consider alternative medications for major interactions',
        'Include patient education and monitoring instructions'
      ]
    },

    // Pharmacist-Specific Steps
    {
      id: 'pharmacist-orders',
      title: 'Prescription Order Management',
      content: 'Receive and process prescription orders from the AIPC system with built-in safety checking and dispensing guidelines.',
      userType: 'pharmacist',
      tips: [
        'Verify prescription details against patient profile',
        'Check for any additional interactions with OTC medications',
        'Provide patient counseling based on AI-generated education materials'
      ]
    },
    {
      id: 'pharmacist-interactions',
      title: 'Advanced Interaction Checking',
      content: 'Use the enhanced drug interaction database to verify safety and provide alternative recommendations when needed.',
      userType: 'pharmacist',
      actionRequired: 'Always perform independent verification of drug interactions',
      tips: [
        'Consider patient-specific factors like age and kidney function',
        'Document any interventions or recommendations',
        'Contact prescriber for major interaction concerns'
      ]
    },

    // Lab Technician Steps
    {
      id: 'lab-orders',
      title: 'Laboratory Test Orders',
      content: 'Process test orders from the AIPC system with specialty-specific normal ranges and interpretation guidelines.',
      userType: 'lab',
      tips: [
        'Verify test appropriateness for patient age and condition',
        'Use specialty-specific reference ranges when applicable',
        'Flag critical values according to established protocols'
      ]
    },
    {
      id: 'lab-results',
      title: 'Results Interpretation Support',
      content: 'The system provides context-aware interpretation guidelines and suggests follow-up testing when appropriate.',
      userType: 'lab',
      actionRequired: 'Always follow laboratory protocols for critical value reporting',
      tips: [
        'Consider clinical context when interpreting results',
        'Use AI suggestions as supplementary information',
        'Maintain quality control standards'
      ]
    }
  ];

  const relevantSteps = tutorialSteps.filter(step => 
    step.userType === 'all' || step.userType === userType
  );

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < relevantSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = relevantSteps[currentStep];
  const progress = ((currentStep + 1) / relevantSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Icons.BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                AIPC Interactive Tutorial
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icons.X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {relevantSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {relevantSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index < currentStep || completedSteps.has(index) ? (
                  <Icons.CheckCircle className="h-3 w-3 inline mr-1" />
                ) : null}
                {step.title}
              </button>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">
              {currentStepData.title}
            </h4>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              {currentStepData.content}
            </p>

            {currentStepData.actionRequired && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <Icons.AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Action Required:
                    </p>
                    <p className="text-sm text-yellow-700">
                      {currentStepData.actionRequired}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStepData.tips && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Icons.Lightbulb className="h-4 w-4 mr-2" />
                  Pro Tips:
                </h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  {currentStepData.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onSkip}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                Skip Tutorial
              </button>
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {currentStep === relevantSteps.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTutorial;
