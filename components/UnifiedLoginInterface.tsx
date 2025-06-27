import React, { useState } from 'react';
import { Icons } from '../constants';
import { User, UserRole, testUsers } from '../types/roleTypes';
import { apiService, ApiService } from '../services/apiService';

interface UnifiedLoginInterfaceProps {
  onLogin: (user: User) => void;
}

const UnifiedLoginInterface: React.FC<UnifiedLoginInterfaceProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  const userTypes = [
    { 
      role: 'patient', 
      label: 'Patient', 
      icon: '👤', 
      description: 'Access your health records, book appointments, and manage your care',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    { 
      role: 'doctor', 
      label: 'Doctor', 
      icon: '👨‍⚕️', 
      description: 'Clinical decision support and patient care management',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    { 
      role: 'pharmacy_manager', 
      label: 'Pharmacy Manager', 
      icon: '💊', 
      description: 'Prescription management and fulfillment operations',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    { 
      role: 'lab_manager', 
      label: 'Laboratory Manager', 
      icon: '🔬', 
      description: 'Test processing and results management',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    { 
      role: 'clinic_coordinator', 
      label: 'Clinic Coordinator', 
      icon: '📋', 
      description: 'Patient coordination and workflow management',
      color: 'bg-teal-50 border-teal-200 text-teal-700'
    },
    { 
      role: 'marketplace_manager', 
      label: 'Marketplace Manager', 
      icon: '🏢', 
      description: 'Network orchestration and business operations',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    }
  ];

  const handleQuickLogin = (role: UserRole) => {
    const demoCredentials = ApiService.getDemoCredentials();

    // Map roles to demo credentials
    if (role === 'patient') {
      setEmail(demoCredentials.patient.email);
      setPassword(demoCredentials.patient.password);
    } else if (role === 'doctor') {
      setEmail(demoCredentials.doctor.email);
      setPassword(demoCredentials.doctor.password);
    } else if (role === 'admin' || role === 'marketplace_manager') {
      setEmail(demoCredentials.admin.email);
      setPassword(demoCredentials.admin.password);
    } else {
      // For other roles, use patient credentials as fallback
      setEmail(demoCredentials.patient.email);
      setPassword(demoCredentials.patient.password);
    }

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use real API authentication
      const response = await apiService.login({ email, password });

      if (response.success && response.data?.user) {
        // Convert API user to frontend User type
        const user: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          role: response.data.user.role as UserRole,
          isActive: response.data.user.isActive,
          lastLogin: new Date(),
          createdAt: new Date(response.data.user.createdAt),
          updatedAt: new Date(response.data.user.updatedAt),
        };

        onLogin(user);
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Icons.Heart className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">AIPC Healthcare Platform</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Unified Healthcare Ecosystem for All Stakeholders
          </p>
          <p className="text-sm text-gray-500">
            Connecting patients, providers, and healthcare professionals in one integrated platform
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="lg:flex">
            {/* Quick Login Section */}
            <div className="lg:w-2/3 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Choose Your Role
                </h2>
                <button
                  onClick={() => setShowQuickLogin(!showQuickLogin)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {showQuickLogin ? 'Hide' : 'Show'} Demo Accounts
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {userTypes.map((userType) => (
                  <button
                    key={userType.role}
                    onClick={() => handleQuickLogin(userType.role as UserRole)}
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${userType.color}`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{userType.icon}</span>
                      <span className="font-semibold text-lg">{userType.label}</span>
                    </div>
                    <p className="text-sm opacity-75">{userType.description}</p>
                  </button>
                ))}
              </div>

              {showQuickLogin && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Demo Account Credentials</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {testUsers.map((user) => (
                      <div key={user.id} className="bg-white rounded p-3">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.organizationName}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-800 mt-3">
                    Password for all accounts: <code className="bg-blue-200 px-1 rounded">demo123</code>
                  </p>
                </div>
              )}

              {/* Features Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Icons.Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Secure & Compliant</h3>
                  <p className="text-xs text-gray-600">HIPAA-compliant platform with role-based access</p>
                </div>
                <div className="text-center p-4">
                  <Icons.Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
                  <p className="text-xs text-gray-600">Advanced AI for clinical decision support</p>
                </div>
                <div className="text-center p-4">
                  <Icons.Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Integrated Ecosystem</h3>
                  <p className="text-xs text-gray-600">Seamless coordination across all stakeholders</p>
                </div>
              </div>
            </div>

            {/* Login Form Section */}
            <div className="lg:w-1/3 bg-gray-50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Sign In
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Icons.Loader className="h-4 w-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Icons.LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-3">
                  Don't have an account?
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                  Request Access
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-2">
                  <strong>Live Demo System</strong><br />
                  Connected to real backend API
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Patient:</strong> patient1@example.com / Patient123!</div>
                  <div><strong>Doctor:</strong> dr.smith@aipc.com / Doctor123!</div>
                  <div><strong>Admin:</strong> admin@aipc.com / Admin123!</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by AI | AIPC Healthcare Platform | 
            <span className="text-blue-600 ml-1">Transforming Healthcare Delivery</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLoginInterface;
