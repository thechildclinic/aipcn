import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { User, HealthMessage, PersonalHealthRecord, MarketplaceOffer } from '../types/roleTypes';

interface PatientDashboardProps {
  user: User;
  onLogout: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'health_records' | 'symptom_checker' | 'messages' | 'marketplace' | 'settings'>('dashboard');
  const [healthMessages, setHealthMessages] = useState<HealthMessage[]>([]);
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isPremium = user.subscriptionTier === 'premium';

  // Sample data for demonstration
  useEffect(() => {
    const sampleMessages: HealthMessage[] = [
      {
        id: 'msg_001',
        patientId: user.id,
        type: 'medication_reminder',
        title: 'Medication Reminder',
        message: 'Time to take your Lisinopril 10mg. Take with water, preferably in the morning.',
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        actionRequired: true,
        actionUrl: '/medications',
        relatedCondition: 'Hypertension'
      },
      {
        id: 'msg_002',
        patientId: user.id,
        type: 'health_tip',
        title: 'Heart Health Tip',
        message: 'Regular exercise can help manage your blood pressure. Try 30 minutes of walking daily.',
        priority: 'low',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionRequired: false,
        relatedCondition: 'Hypertension'
      },
      {
        id: 'msg_003',
        patientId: user.id,
        type: 'test_result_alert',
        title: 'Lab Results Available',
        message: 'Your recent HbA1c test results are now available. Please review with your doctor.',
        priority: 'high',
        isRead: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actionRequired: true,
        actionUrl: '/lab-results',
        relatedCondition: 'Type 2 Diabetes'
      }
    ];

    const sampleOffers: MarketplaceOffer[] = [
      {
        id: 'offer_001',
        providerId: 'pharmacy_001',
        providerName: 'QuickRx Pharmacy',
        offerType: 'discount',
        title: '20% Off Diabetes Medications',
        description: 'Special discount on all diabetes medications for premium members.',
        discountPercentage: 20,
        originalPrice: 150,
        discountedPrice: 120,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        conditions: ['Valid for premium members only', 'Cannot be combined with insurance'],
        targetPatientConditions: ['Type 2 Diabetes'],
        subscriptionTierRequired: 'premium',
        isActive: true
      },
      {
        id: 'offer_002',
        providerId: 'lab_001',
        providerName: 'Precision Diagnostics Lab',
        offerType: 'package',
        title: 'Comprehensive Health Checkup',
        description: 'Complete health screening package including blood work and cardiac assessment.',
        originalPrice: 300,
        discountedPrice: 199,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conditions: ['Includes 15 tests', 'Results within 24 hours'],
        isActive: true
      }
    ];

    setHealthMessages(sampleMessages);
    setMarketplaceOffers(sampleOffers);
  }, [user.id]);

  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const responses = [
        "Based on your symptoms, this could be related to your existing hypertension. Consider monitoring your blood pressure and contact your doctor if symptoms persist.",
        "Your symptoms may indicate a need for medication adjustment. Please schedule an appointment with your healthcare provider.",
        "These symptoms are common but should be evaluated. Consider booking a consultation for proper assessment."
      ];
      
      setAiResponse(responses[Math.floor(Math.random() * responses.length)]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const markMessageAsRead = (messageId: string) => {
    setHealthMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true, readAt: new Date() } : msg
    ));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'medication_reminder': return Icons.Pill;
      case 'health_tip': return Icons.Heart;
      case 'appointment_reminder': return Icons.Calendar;
      case 'test_result_alert': return Icons.FileText;
      default: return Icons.Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
    { id: 'health_records', label: 'Health Records', icon: Icons.FileText },
    { id: 'symptom_checker', label: 'Symptom Checker', icon: Icons.Search, premium: true },
    { id: 'messages', label: 'Messages', icon: Icons.MessageSquare, count: healthMessages.filter(m => !m.isRead).length },
    { id: 'marketplace', label: 'Marketplace', icon: Icons.ShoppingCart },
    { id: 'settings', label: 'Settings', icon: Icons.Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
                <div className="flex items-center">
                  <p className="text-sm text-gray-600 mr-3">Welcome, {user.name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isPremium ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isPremium ? '⭐ Premium' : 'Basic'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isPremium && (
                <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-yellow-500 hover:to-orange-600 transition-colors">
                  Upgrade to Premium
                </button>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <Icons.LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={tab.premium && !isPremium}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${tab.premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.premium && !isPremium && (
                  <Icons.Lock className="h-3 w-3 ml-1 text-yellow-500" />
                )}
                {tab.count && tab.count > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Dashboard</h2>
            
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Heart className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">2</p>
                    <p className="text-sm text-gray-600">Active Conditions</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Pill className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-600">Current Medications</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Calendar className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">1</p>
                    <p className="text-sm text-gray-600">Upcoming Appointments</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Bell className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{healthMessages.filter(m => !m.isRead).length}</p>
                    <p className="text-sm text-gray-600">Unread Messages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Messages</h3>
              <div className="space-y-3">
                {healthMessages.slice(0, 3).map((message) => {
                  const MessageIcon = getMessageIcon(message.type);
                  return (
                    <div 
                      key={message.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        message.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markMessageAsRead(message.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <MessageIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{message.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{message.createdAt.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                          {message.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <button 
                onClick={() => setActiveTab('symptom_checker')}
                disabled={!isPremium}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow ${
                  !isPremium ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Icons.Search className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">AI Symptom Checker</h3>
                <p className="text-sm text-gray-600">Get instant AI-powered health insights</p>
                {!isPremium && (
                  <span className="inline-block mt-2 text-xs text-yellow-600 font-medium">Premium Feature</span>
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('health_records')}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
              >
                <Icons.FileText className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Health Records</h3>
                <p className="text-sm text-gray-600">View your complete medical history</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('marketplace')}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
              >
                <Icons.ShoppingCart className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Marketplace</h3>
                <p className="text-sm text-gray-600">Exclusive offers and discounts</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'symptom_checker' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Symptom Checker</h2>
            
            {isPremium ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your symptoms
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please describe what you're experiencing..."
                  />
                </div>
                
                <button
                  onClick={handleSymptomAnalysis}
                  disabled={isAnalyzing || !symptoms.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isAnalyzing ? (
                    <>
                      <Icons.Loader className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Icons.Search className="h-4 w-4 mr-2" />
                      Analyze Symptoms
                    </>
                  )}
                </button>

                {aiResponse && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">AI Analysis</h3>
                    <p className="text-blue-800">{aiResponse}</p>
                    <p className="text-xs text-blue-600 mt-3">
                      This is AI-generated guidance and should not replace professional medical advice.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Icons.Lock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                <p className="text-gray-600 mb-4">
                  Upgrade to Premium to access our AI-powered symptom checker with unlimited consultations.
                </p>
                <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-md font-medium hover:from-yellow-500 hover:to-orange-600 transition-colors">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Messages</h2>
            <div className="space-y-4">
              {healthMessages.map((message) => {
                const MessageIcon = getMessageIcon(message.type);
                return (
                  <div 
                    key={message.id} 
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${
                      message.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
                    }`}
                    onClick={() => markMessageAsRead(message.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <MessageIcon className="h-6 w-6 text-blue-600 mr-4 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{message.title}</h3>
                          <p className="text-gray-700 mb-2">{message.message}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{message.createdAt.toLocaleString()}</span>
                            {message.relatedCondition && (
                              <span className="ml-4 px-2 py-1 bg-gray-100 rounded text-xs">
                                {message.relatedCondition}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPriorityColor(message.priority)}`}>
                          {message.priority.toUpperCase()}
                        </span>
                        {!message.isRead && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Healthcare Marketplace</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {marketplaceOffers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                      <p className="text-sm text-gray-600">{offer.providerName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      offer.subscriptionTierRequired === 'premium' ? 'bg-gold-100 text-gold-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {offer.offerType.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{offer.description}</p>
                  
                  {offer.originalPrice && offer.discountedPrice && (
                    <div className="flex items-center mb-4">
                      <span className="text-2xl font-bold text-green-600">${offer.discountedPrice}</span>
                      <span className="text-lg text-gray-500 line-through ml-2">${offer.originalPrice}</span>
                      {offer.discountPercentage && (
                        <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                          {offer.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Valid until: {offer.validUntil.toLocaleDateString()}</p>
                  </div>
                  
                  <button 
                    disabled={offer.subscriptionTierRequired === 'premium' && !isPremium}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      offer.subscriptionTierRequired === 'premium' && !isPremium
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {offer.subscriptionTierRequired === 'premium' && !isPremium 
                      ? 'Premium Required' 
                      : 'Claim Offer'
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health_records' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Health Records</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Comprehensive health records interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Account settings and preferences would be implemented here...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
