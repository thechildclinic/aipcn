import React, { useState } from 'react';
import { User } from '../types/roleTypes';
import { AuthProvider, useAuth } from './RoleBasedAuth';
import UnifiedLoginInterface from './UnifiedLoginInterface';
import PatientDashboard from './PatientDashboard';
import PharmacyManagerDashboard from './PharmacyManagerDashboard';
import LabManagerDashboard from './LabManagerDashboard';
import ClinicCoordinatorDashboard from './ClinicCoordinatorDashboard';
import MarketplaceManagerDashboard from './MarketplaceManagerDashboard';
import DemoInterface from './DemoInterface';
import TestRunner from './TestRunner';
import InteractiveTutorial from './InteractiveTutorial';
import { Icons } from '../constants';

// Main Role-Based Application Component
const RoleBasedAppContent: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showDemo, setShowDemo] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    // User is automatically set by the auth context
    console.log('User logged in:', loggedInUser);
  };

  const handleLogout = () => {
    logout();
    setShowDemo(false);
    setShowTests(false);
    setShowTutorial(false);
  };

  // If not authenticated, show unified login interface
  if (!isAuthenticated || !user) {
    return <UnifiedLoginInterface onLogin={handleLogin} />;
  }

  // If showing demo interface
  if (showDemo) {
    return (
      <DemoInterface
        onStartDemo={(scenario) => {
          console.log('Starting demo with scenario:', scenario);
          // Demo scenario would be handled here
        }}
        onExitDemo={() => setShowDemo(false)}
      />
    );
  }

  // If showing test runner
  if (showTests) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">AIPC Test Suite</h1>
              <button
                onClick={() => setShowTests(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Icons.ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <TestRunner />
      </div>
    );
  }

  // If showing tutorial
  if (showTutorial) {
    return (
      <InteractiveTutorial
        userType={user.role === 'pharmacy_manager' ? 'pharmacist' : 
                 user.role === 'lab_manager' ? 'lab' :
                 user.role === 'clinic_coordinator' ? 'doctor' : 'all'}
        onComplete={() => setShowTutorial(false)}
        onSkip={() => setShowTutorial(false)}
      />
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'patient':
        return <PatientDashboard user={user} onLogout={handleLogout} />;

      case 'pharmacy_manager':
        return <PharmacyManagerDashboard user={user} onLogout={handleLogout} />;

      case 'lab_manager':
        return <LabManagerDashboard user={user} onLogout={handleLogout} />;

      case 'clinic_coordinator':
        return <ClinicCoordinatorDashboard user={user} onLogout={handleLogout} />;

      case 'marketplace_manager':
        return <MarketplaceManagerDashboard user={user} onLogout={handleLogout} />;
      
      case 'doctor':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center">
                    <Icons.Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                      <p className="text-sm text-gray-600">{user.organizationName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                      <Icons.LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Icons.Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor Interface</h2>
                <p className="text-gray-600 mb-6">
                  The doctor interface integrates with the existing AIPC clinical decision support system.
                  Access the main AIPC application for full clinical features.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.open('/', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors flex items-center"
                  >
                    <Icons.ExternalLink className="h-4 w-4 mr-2" />
                    Open AIPC Clinical System
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Not Implemented</h2>
              <p className="text-gray-600">Dashboard for role "{user.role}" is not yet implemented.</p>
              <button
                onClick={handleLogout}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Global Action Bar */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTutorial(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Interactive Tutorial"
          >
            <Icons.BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDemo(true)}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Demo Interface"
          >
            <Icons.Play className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowTests(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Test Suite"
          >
            <Icons.TestTube className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Dashboard */}
      {renderDashboard()}
    </div>
  );
};

// Main App Component with Auth Provider
const RoleBasedApp: React.FC = () => {
  return (
    <AuthProvider>
      <RoleBasedAppContent />
    </AuthProvider>
  );
};

export default RoleBasedApp;
