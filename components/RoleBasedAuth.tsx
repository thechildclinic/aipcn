import React, { useState, createContext, useContext, useEffect } from 'react';
import { Icons } from '../constants';
import { User, UserRole, testUsers } from '../types/roleTypes';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('aipc_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate authentication with test users
    const foundUser = testUsers.find(u => u.email === email);
    
    if (foundUser && password === 'demo123') {
      const userWithLogin = { ...foundUser, lastLogin: new Date() };
      setUser(userWithLogin);
      setIsAuthenticated(true);
      localStorage.setItem('aipc_user', JSON.stringify(userWithLogin));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('aipc_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const roleOptions = [
    { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', description: 'Clinical decision support and patient care' },
    { value: 'pharmacy_manager', label: 'Pharmacy Manager', icon: '💊', description: 'Prescription management and fulfillment' },
    { value: 'lab_manager', label: 'Laboratory Manager', icon: '🔬', description: 'Test processing and results management' },
    { value: 'clinic_coordinator', label: 'Clinic Coordinator', icon: '📋', description: 'Patient coordination and workflow management' }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const testUser = testUsers.find(u => u.role === role);
    if (testUser) {
      setEmail(testUser.email);
      setPassword('demo123');
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        const user = testUsers.find(u => u.email === email);
        if (user) {
          onLogin(user);
        }
      } else {
        setError('Invalid credentials. Use demo123 as password for test accounts.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏥 AIPC Healthcare Ecosystem
          </h1>
          <p className="text-xl text-gray-600">
            Role-Based Access for Healthcare Professionals
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Role Selection */}
            <div className="md:w-1/2 bg-gray-50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Select Your Role
              </h2>
              <div className="space-y-4">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelect(role.value as UserRole)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{role.icon}</span>
                      <span className="font-semibold text-lg">{role.label}</span>
                    </div>
                    <p className="text-sm opacity-75">{role.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Demo Credentials</h3>
                <p className="text-sm text-blue-800">
                  Password for all test accounts: <code className="bg-blue-200 px-1 rounded">demo123</code>
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="md:w-1/2 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Sign In
              </h2>

              {selectedRole && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {roleOptions.find(r => r.value === selectedRole)?.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-green-800">
                        {roleOptions.find(r => r.value === selectedRole)?.label}
                      </p>
                      <p className="text-sm text-green-600">
                        {testUsers.find(u => u.role === selectedRole)?.organizationName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isLoading || !selectedRole}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                <p className="text-sm text-gray-600">
                  Demo system with test accounts for evaluation purposes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
