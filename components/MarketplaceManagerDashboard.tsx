import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { User, NetworkProvider, CommissionStructure, BusinessRule, NetworkPerformance, Dispute } from '../types/roleTypes';

interface MarketplaceManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

const MarketplaceManagerDashboard: React.FC<MarketplaceManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'network' | 'commissions' | 'rules' | 'disputes' | 'analytics'>('dashboard');
  const [providers, setProviders] = useState<NetworkProvider[]>([]);
  const [commissions, setCommissions] = useState<CommissionStructure[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [performance, setPerformance] = useState<NetworkPerformance | null>(null);

  // Sample data for demonstration
  useEffect(() => {
    const sampleProviders: NetworkProvider[] = [
      {
        id: 'provider_001',
        name: 'QuickRx Pharmacy',
        type: 'pharmacy',
        status: 'active',
        joinDate: new Date('2023-06-15'),
        contactInfo: {
          email: 'manager@quickrx.com',
          phone: '(555) 123-4567',
          address: '123 Main St, City, State 12345'
        },
        services: ['Prescription Fulfillment', 'Medication Counseling', 'Home Delivery'],
        performanceMetrics: {
          rating: 4.8,
          completedOrders: 1250,
          averageResponseTime: 15,
          customerSatisfaction: 4.7
        },
        commissionRate: 8.5,
        contractTerms: 'Standard pharmacy agreement with 8.5% commission on all orders'
      },
      {
        id: 'provider_002',
        name: 'Precision Diagnostics Lab',
        type: 'lab',
        status: 'active',
        joinDate: new Date('2023-08-20'),
        contactInfo: {
          email: 'supervisor@precisionlab.com',
          phone: '(555) 987-6543',
          address: '456 Oak Ave, City, State 12345'
        },
        services: ['Blood Tests', 'Imaging', 'Pathology', 'Rapid Testing'],
        performanceMetrics: {
          rating: 4.9,
          completedOrders: 890,
          averageResponseTime: 24,
          customerSatisfaction: 4.8
        },
        commissionRate: 12.0,
        contractTerms: 'Premium lab services with 12% commission and quality bonuses'
      },
      {
        id: 'provider_003',
        name: 'Cardiac Care Specialists',
        type: 'clinic',
        status: 'pending',
        joinDate: new Date('2024-01-10'),
        contactInfo: {
          email: 'admin@cardiaccare.com',
          phone: '(555) 456-7890',
          address: '789 Heart Blvd, City, State 12345'
        },
        services: ['Cardiology Consultations', 'Cardiac Testing', 'Emergency Care'],
        performanceMetrics: {
          rating: 0,
          completedOrders: 0,
          averageResponseTime: 0,
          customerSatisfaction: 0
        },
        commissionRate: 15.0,
        contractTerms: 'Specialty clinic agreement pending approval'
      }
    ];

    const sampleCommissions: CommissionStructure[] = [
      {
        id: 'comm_001',
        providerType: 'pharmacy',
        serviceType: 'Prescription Fulfillment',
        commissionRate: 8.5,
        minimumVolume: 100,
        bonusThresholds: [
          { volume: 500, bonusRate: 1.0 },
          { volume: 1000, bonusRate: 2.0 }
        ],
        effectiveDate: new Date('2023-01-01')
      },
      {
        id: 'comm_002',
        providerType: 'lab',
        serviceType: 'Diagnostic Testing',
        commissionRate: 12.0,
        minimumVolume: 50,
        bonusThresholds: [
          { volume: 200, bonusRate: 1.5 },
          { volume: 500, bonusRate: 3.0 }
        ],
        effectiveDate: new Date('2023-01-01')
      }
    ];

    const sampleRules: BusinessRule[] = [
      {
        id: 'rule_001',
        name: 'Emergency Order Routing',
        type: 'routing',
        conditions: [
          { field: 'urgency', operator: 'equals', value: 'emergency' },
          { field: 'response_time', operator: 'less_than', value: 30 }
        ],
        actions: [
          { type: 'route_to_fastest', value: 'true' },
          { type: 'priority_level', value: 'urgent' }
        ],
        priority: 1,
        isActive: true,
        createdAt: new Date('2023-06-01'),
        lastModified: new Date('2023-12-15')
      },
      {
        id: 'rule_002',
        name: 'Premium Patient Pricing',
        type: 'pricing',
        conditions: [
          { field: 'patient_tier', operator: 'equals', value: 'premium' }
        ],
        actions: [
          { type: 'discount_percentage', value: 15 },
          { type: 'priority_processing', value: 'true' }
        ],
        priority: 2,
        isActive: true,
        createdAt: new Date('2023-07-01'),
        lastModified: new Date('2023-11-20')
      }
    ];

    const sampleDisputes: Dispute[] = [
      {
        id: 'dispute_001',
        type: 'service_quality',
        status: 'investigating',
        priority: 'high',
        reportedBy: {
          userId: 'patient_001',
          userType: 'patient',
          name: 'John Doe'
        },
        reportedAgainst: {
          providerId: 'provider_001',
          providerName: 'QuickRx Pharmacy',
          providerType: 'pharmacy'
        },
        description: 'Medication delivered late and packaging was damaged. Patient had to wait additional day for replacement.',
        createdAt: new Date('2024-01-14'),
        assignedTo: user.id
      }
    ];

    const samplePerformance: NetworkPerformance = {
      period: 'monthly',
      totalRevenue: 125000,
      totalCommissions: 12500,
      orderVolume: 1450,
      averageOrderValue: 86.21,
      customerSatisfaction: 4.7,
      providerPerformance: [
        {
          providerId: 'provider_001',
          providerName: 'QuickRx Pharmacy',
          revenue: 75000,
          orders: 890,
          rating: 4.8
        },
        {
          providerId: 'provider_002',
          providerName: 'Precision Diagnostics Lab',
          revenue: 50000,
          orders: 560,
          rating: 4.9
        }
      ],
      topPerformingServices: ['Prescription Fulfillment', 'Blood Tests', 'Medication Counseling'],
      issuesResolved: 23,
      pendingDisputes: 1
    };

    setProviders(sampleProviders);
    setCommissions(sampleCommissions);
    setBusinessRules(sampleRules);
    setDisputes(sampleDisputes);
    setPerformance(samplePerformance);
  }, [user.id]);

  const handleApproveProvider = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, status: 'active' } : provider
    ));
  };

  const handleSuspendProvider = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, status: 'suspended' } : provider
    ));
  };

  const handleResolveDispute = (disputeId: string) => {
    setDisputes(prev => prev.map(dispute => 
      dispute.id === disputeId ? { ...dispute, status: 'resolved', resolvedAt: new Date() } : dispute
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'pharmacy': return Icons.Pill;
      case 'lab': return Icons.TestTube;
      case 'clinic': return Icons.Building;
      default: return Icons.Building;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
    { id: 'network', label: 'Network Providers', icon: Icons.Users, count: providers.filter(p => p.status === 'pending').length },
    { id: 'commissions', label: 'Commissions', icon: Icons.DollarSign },
    { id: 'rules', label: 'Business Rules', icon: Icons.Settings },
    { id: 'disputes', label: 'Disputes', icon: Icons.AlertTriangle, count: disputes.filter(d => d.status !== 'resolved').length },
    { id: 'analytics', label: 'Analytics', icon: Icons.BarChart }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.Globe className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketplace Manager</h1>
                <p className="text-sm text-gray-600">{user.organizationName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Network Overview</h2>
            
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{providers.filter(p => p.status === 'active').length}</p>
                    <p className="text-sm text-gray-600">Active Providers</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${performance?.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.ShoppingCart className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{performance?.orderVolume}</p>
                    <p className="text-sm text-gray-600">Monthly Orders</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Star className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{performance?.customerSatisfaction}</p>
                    <p className="text-sm text-gray-600">Satisfaction Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Provider Approvals</h3>
              <div className="space-y-3">
                {providers.filter(p => p.status === 'pending').map((provider) => {
                  const ProviderIcon = getProviderIcon(provider.type);
                  return (
                    <div key={provider.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <ProviderIcon className="h-6 w-6 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{provider.name}</p>
                          <p className="text-sm text-gray-600">{provider.type} | {provider.contactInfo.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveProvider(provider.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Disputes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Disputes</h3>
              <div className="space-y-3">
                {disputes.filter(d => d.status !== 'resolved').map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-gray-900">{dispute.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {dispute.reportedBy.name} vs {dispute.reportedAgainst.providerName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dispute.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        dispute.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dispute.priority.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleResolveDispute(dispute.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Investigate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Network Providers</h2>
            <div className="grid gap-6">
              {providers.map((provider) => {
                const ProviderIcon = getProviderIcon(provider.type);
                return (
                  <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <ProviderIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{provider.type} | Joined {provider.joinDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                          {provider.status.toUpperCase()}
                        </span>
                        {provider.status === 'active' && (
                          <button
                            onClick={() => handleSuspendProvider(provider.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {provider.status === 'pending' && (
                          <button
                            onClick={() => handleApproveProvider(provider.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <p className="text-sm text-gray-600">{provider.contactInfo.email}</p>
                        <p className="text-sm text-gray-600">{provider.contactInfo.phone}</p>
                        <p className="text-sm text-gray-600">{provider.contactInfo.address}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Rating:</span>
                            <span className="ml-2 font-medium">{provider.performanceMetrics.rating}/5.0</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Orders:</span>
                            <span className="ml-2 font-medium">{provider.performanceMetrics.completedOrders}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Response:</span>
                            <span className="ml-2 font-medium">{provider.performanceMetrics.averageResponseTime}min</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Commission:</span>
                            <span className="ml-2 font-medium">{provider.commissionRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.services.map((service, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'commissions' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Commission Management</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Commission structure management interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Rules Engine</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Business rules configuration interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Dispute Resolution</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Dispute management and resolution interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Network Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-medium">${performance?.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Commissions:</span>
                    <span className="font-medium">${performance?.totalCommissions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Order Value:</span>
                    <span className="font-medium">${performance?.averageOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top Performing Providers</h3>
                <div className="space-y-3">
                  {performance?.providerPerformance.map((provider, index) => (
                    <div key={provider.providerId} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{provider.providerName}</p>
                        <p className="text-sm text-gray-600">{provider.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${provider.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">⭐ {provider.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceManagerDashboard;
