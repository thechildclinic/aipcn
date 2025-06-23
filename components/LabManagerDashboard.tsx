import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { LabTestOrder, LabResult, QualityControlCheck, User } from '../types/roleTypes';

interface LabManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

const LabManagerDashboard: React.FC<LabManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'processing' | 'results' | 'quality' | 'analytics'>('orders');
  const [testOrders, setTestOrders] = useState<LabTestOrder[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabTestOrder | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Sample data for demonstration
  useEffect(() => {
    const sampleOrders: LabTestOrder[] = [
      {
        id: 'LAB001',
        patientId: 'P001',
        patientName: 'Robert Chen',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        clinicName: 'Cardiac Care Specialists',
        tests: [
          {
            testCode: 'LIPID',
            testName: 'Lipid Panel',
            category: 'Chemistry',
            sampleType: 'blood',
            fastingRequired: true,
            estimatedTurnaroundTime: 4,
            urgency: 'routine'
          },
          {
            testCode: 'TROP',
            testName: 'Troponin I',
            category: 'Cardiac Markers',
            sampleType: 'blood',
            fastingRequired: false,
            estimatedTurnaroundTime: 2,
            urgency: 'urgent'
          }
        ],
        orderDate: new Date('2024-01-15'),
        urgency: 'urgent',
        status: 'pending',
        clinicalInfo: 'Patient with chest pain, rule out ACS',
        fastingRequired: true,
        specialInstructions: 'Priority processing for cardiac markers'
      },
      {
        id: 'LAB002',
        patientId: 'P002',
        patientName: 'Maria Rodriguez',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        clinicName: 'Cardiac Care Specialists',
        tests: [
          {
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            category: 'Hematology',
            sampleType: 'blood',
            fastingRequired: false,
            estimatedTurnaroundTime: 3,
            urgency: 'routine'
          },
          {
            testCode: 'BMP',
            testName: 'Basic Metabolic Panel',
            category: 'Chemistry',
            sampleType: 'blood',
            fastingRequired: true,
            estimatedTurnaroundTime: 4,
            urgency: 'routine'
          }
        ],
        orderDate: new Date('2024-01-16'),
        urgency: 'routine',
        status: 'sample_collected',
        clinicalInfo: 'Routine follow-up for hypertension',
        fastingRequired: true,
        appointmentDate: new Date('2024-01-17T09:00:00'),
        sampleCollectionDate: new Date('2024-01-17T09:15:00')
      }
    ];
    setTestOrders(sampleOrders);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sample_collected': return 'bg-purple-100 text-purple-800';
      case 'processing': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reported': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'stat': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'routine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleScheduleAppointment = (orderId: string, appointmentDate: Date) => {
    setTestOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'scheduled', appointmentDate }
        : order
    ));
  };

  const handleSampleCollection = (orderId: string) => {
    setTestOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'sample_collected', sampleCollectionDate: new Date() }
        : order
    ));
  };

  const handleStartProcessing = (orderId: string) => {
    setTestOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'processing' }
        : order
    ));
  };

  const tabs = [
    { id: 'orders', label: 'Test Orders', icon: Icons.FileText, count: testOrders.filter(o => ['pending', 'scheduled'].includes(o.status)).length },
    { id: 'processing', label: 'Processing', icon: Icons.Activity, count: testOrders.filter(o => ['sample_collected', 'processing'].includes(o.status)).length },
    { id: 'results', label: 'Results', icon: Icons.CheckCircle, count: results.length },
    { id: 'quality', label: 'Quality Control', icon: Icons.Shield, count: 0 },
    { id: 'analytics', label: 'Analytics', icon: Icons.BarChart, count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.TestTube className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Laboratory Manager</h1>
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
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
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
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Laboratory Test Orders</h2>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option>All Urgency</option>
                  <option>STAT</option>
                  <option>Urgent</option>
                  <option>Routine</option>
                </select>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Scheduled</option>
                  <option>Sample Collected</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {testOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(order.urgency)}`}>
                          {order.urgency.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Patient: <span className="font-medium">{order.patientName}</span> | 
                        Doctor: <span className="font-medium">{order.doctorName}</span> | 
                        Clinic: <span className="font-medium">{order.clinicName}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Order Date: {order.orderDate.toLocaleDateString()}
                        {order.appointmentDate && (
                          <span> | Appointment: {order.appointmentDate.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleScheduleAppointment(order.id, new Date())}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Schedule
                        </button>
                      )}
                      {order.status === 'scheduled' && (
                        <button
                          onClick={() => handleSampleCollection(order.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Collect Sample
                        </button>
                      )}
                      {order.status === 'sample_collected' && (
                        <button
                          onClick={() => handleStartProcessing(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Start Processing
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tests Ordered ({order.tests.length})</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {order.tests.map((test, index) => (
                        <div key={index} className="bg-gray-50 rounded p-3">
                          <p className="font-medium text-gray-900">{test.testName} ({test.testCode})</p>
                          <p className="text-sm text-gray-600">
                            Category: {test.category} | Sample: {test.sampleType}
                          </p>
                          <p className="text-sm text-gray-600">
                            TAT: {test.estimatedTurnaroundTime}h
                            {test.fastingRequired && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                Fasting Required
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.clinicalInfo && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Clinical Information:</span><br />
                        {order.clinicalInfo}
                      </p>
                      {order.specialInstructions && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Special Instructions:</span><br />
                          {order.specialInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'processing' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tests in Processing</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Test processing workflow would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Results Management</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Results entry and management interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quality Control</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Quality control checks and validation would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Laboratory Analytics</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-gray-600">Tests This Month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Clock className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3.2h</p>
                    <p className="text-sm text-gray-600">Avg Turnaround Time</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">98.5%</p>
                    <p className="text-sm text-gray-600">Quality Score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabManagerDashboard;
