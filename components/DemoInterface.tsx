import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { demoManager, DemoScenario } from '../data/demoDataManager';
import { ClinicSpecialty } from '../types';
import MedicalDisclaimer from './MedicalDisclaimer';

interface DemoInterfaceProps {
  onStartDemo: (scenario: DemoScenario) => void;
  onExitDemo: () => void;
}

const DemoInterface: React.FC<DemoInterfaceProps> = ({ onStartDemo, onExitDemo }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<ClinicSpecialty>('Cardiology');
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [demoMode, setDemoMode] = useState<'selection' | 'running' | 'complete'>('selection');

  const specialties: ClinicSpecialty[] = [
    'Cardiology',
    'Dermatology', 
    'Orthopedics',
    'Psychiatry',
    'General Practice',
    'Pediatrics',
    'Endocrinology'
  ];

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
  };

  const handleSpecialtyChange = (specialty: ClinicSpecialty) => {
    setSelectedSpecialty(specialty);
    setSelectedScenario(null);
  };

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
  };

  const handleStartDemo = () => {
    if (selectedScenario) {
      demoManager.setCurrentScenario(selectedScenario.id);
      setDemoMode('running');
      onStartDemo(selectedScenario);
    }
  };

  const getSpecialtyIcon = (specialty: ClinicSpecialty) => {
    switch (specialty) {
      case 'Cardiology': return '❤️';
      case 'Dermatology': return '🧴';
      case 'Orthopedics': return '🦴';
      case 'Psychiatry': return '🧠';
      case 'General Practice': return '🏥';
      case 'Pediatrics': return '👶';
      case 'Endocrinology': return '⚗️';
      default: return '🏥';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (showDisclaimer) {
    return <MedicalDisclaimer onAccept={handleDisclaimerAccept} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 AIPC System Demonstration
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Comprehensive AI-Assisted Clinical Decision Support
          </p>
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 inline-block">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> Using sample data for demonstration purposes only
            </p>
          </div>
        </div>

        {/* Medical Disclaimer Banner */}
        <MedicalDisclaimer variant="banner" onAccept={() => {}} showAcceptButton={false} />

        {/* Demo Selection Interface */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Select Demonstration Scenario
          </h2>

          {/* Specialty Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              1. Choose Medical Specialty
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => handleSpecialtyChange(specialty)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedSpecialty === specialty
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{getSpecialtyIcon(specialty)}</div>
                  <div className="text-xs font-medium">{specialty}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              2. Choose Clinical Scenario
            </h3>
            <div className="grid gap-4">
              {demoManager.getScenariosBySpecialty(selectedSpecialty).map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedScenario?.id === scenario.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {scenario.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(scenario.complexity)}`}>
                      {scenario.complexity.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Patient:</strong> {scenario.patient.name}, {scenario.patient.age} years old
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-3">
                    <strong>Presentation:</strong> {scenario.symptoms}
                  </div>
                  
                  <div className="text-sm text-blue-700">
                    <strong>Expected Outcome:</strong> {scenario.expectedOutcome}
                  </div>

                  {selectedScenario?.id === scenario.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-2">Demo Highlights:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {scenario.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <Icons.CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={onExitDemo}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Exit Demo Mode
            </button>
            
            <button
              onClick={handleStartDemo}
              disabled={!selectedScenario}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Icons.Play className="h-5 w-5 mr-2" />
              Start Demonstration
            </button>
          </div>
        </div>

        {/* Demo Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Icons.Brain className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Specialty-Aware AI
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              AI adapts responses based on clinic specialty, providing more relevant and specialized recommendations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Icons.Shield className="h-8 w-8 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Safety Checking
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Comprehensive drug interaction checking with severity levels and alternative recommendations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Icons.Sparkles className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Automated Protocols
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Evidence-based treatment protocols with automated medication, testing, and monitoring recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoInterface;
