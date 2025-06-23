import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { PatientAppointment, PatientJourney, CommunicationLog, User } from '../types/roleTypes';

interface ClinicCoordinatorDashboardProps {
  user: User;
  onLogout: () => void;
}

const ClinicCoordinatorDashboard: React.FC<ClinicCoordinatorDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'patients' | 'communications' | 'analytics'>('dashboard');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [patientJourneys, setPatientJourneys] = useState<PatientJourney[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);

  // Sample data for demonstration
  useEffect(() => {
    const sampleAppointments: PatientAppointment[] = [
      {
        id: 'APT001',
        patientId: 'P001',
        patientName: 'Robert Chen',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        appointmentType: 'consultation',
        scheduledDate: new Date('2024-01-17T10:00:00'),
        duration: 30,
        status: 'scheduled',
        reason: 'Chest pain evaluation',
        priority: 'high'
      },
      {
        id: 'APT002',
        patientId: 'P002',
        patientName: 'Maria Rodriguez',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        appointmentType: 'follow_up',
        scheduledDate: new Date('2024-01-17T11:00:00'),
        duration: 20,
        status: 'checked_in',
        reason: 'Hypertension follow-up',
        priority: 'medium'
      },
      {
        id: 'APT003',
        patientId: 'P003',
        patientName: 'David Kim',
        doctorId: 'D002',
        doctorName: 'Dr. Lisa Chen',
        appointmentType: 'lab_review',
        scheduledDate: new Date('2024-01-17T14:00:00'),
        duration: 15,
        status: 'scheduled',
        reason: 'Review lab results',
        priority: 'low'
      }
    ];

    const sampleJourneys: PatientJourney[] = [
      {
        id: 'PJ001',
        patientId: 'P001',
        patientName: 'Robert Chen',
        currentStage: 'lab_pending',
        stages: [
          { stage: 'registration', status: 'completed', startTime: new Date('2024-01-15T09:00:00'), endTime: new Date('2024-01-15T09:15:00') },
          { stage: 'consultation', status: 'completed', startTime: new Date('2024-01-15T10:00:00'), endTime: new Date('2024-01-15T10:45:00') },
          { stage: 'lab_ordered', status: 'completed', startTime: new Date('2024-01-15T10:45:00'), endTime: new Date('2024-01-15T10:50:00') },
          { stage: 'lab_pending', status: 'in_progress', startTime: new Date('2024-01-15T10:50:00') },
          { stage: 'prescription_ordered', status: 'pending' },
          { stage: 'follow_up_scheduled', status: 'pending' }
        ],
        startDate: new Date('2024-01-15T09:00:00'),
        estimatedCompletion: new Date('2024-01-18T17:00:00')
      }
    ];

    const sampleCommunications: CommunicationLog[] = [
      {
        id: 'COM001',
        patientId: 'P001',
        fromRole: 'lab_manager',
        toRole: 'clinic_coordinator',
        fromUserId: 'lab_001',
        toUserId: user.id,
        messageType: 'lab_result',
        subject: 'Lab Results Ready - Robert Chen',
        message: 'Troponin results are ready for review. Elevated levels detected.',
        priority: 'urgent',
        status: 'delivered',
        sentAt: new Date('2024-01-16T14:30:00')
      },
      {
        id: 'COM002',
        patientId: 'P002',
        fromRole: 'pharmacy_manager',
        toRole: 'clinic_coordinator',
        fromUserId: 'pharm_001',
        toUserId: user.id,
        messageType: 'prescription',
        subject: 'Prescription Ready - Maria Rodriguez',
        message: 'Prescription is ready for pickup at QuickRx Pharmacy.',
        priority: 'medium',
        status: 'read',
        sentAt: new Date('2024-01-16T16:15:00'),
        readAt: new Date('2024-01-16T16:20:00')
      }
    ];

    setAppointments(sampleAppointments);
    setPatientJourneys(sampleJourneys);
    setCommunications(sampleCommunications);
  }, [user.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJourneyStageColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-300';
      case 'skipped': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const handleCheckIn = (appointmentId: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'checked_in' } : apt
    ));
  };

  const handleStartConsultation = (appointmentId: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'in_progress' } : apt
    ));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Home, count: 0 },
    { id: 'appointments', label: 'Appointments', icon: Icons.Calendar, count: appointments.filter(a => ['scheduled', 'checked_in'].includes(a.status)).length },
    { id: 'patients', label: 'Patient Journeys', icon: Icons.Users, count: patientJourneys.filter(p => p.currentStage !== 'completed').length },
    { id: 'communications', label: 'Communications', icon: Icons.MessageSquare, count: communications.filter(c => c.status === 'delivered').length },
    { id: 'analytics', label: 'Analytics', icon: Icons.BarChart, count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.Clipboard className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clinic Coordinator</h1>
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
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Coordination Dashboard</h2>
            
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Calendar className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{appointments.filter(a => a.status === 'scheduled').length}</p>
                    <p className="text-sm text-gray-600">Scheduled Today</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Users className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{patientJourneys.filter(p => p.currentStage !== 'completed').length}</p>
                    <p className="text-sm text-gray-600">Active Patients</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.MessageSquare className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{communications.filter(c => c.status === 'delivered').length}</p>
                    <p className="text-sm text-gray-600">Pending Messages</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{communications.filter(c => c.priority === 'urgent').length}</p>
                    <p className="text-sm text-gray-600">Urgent Items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Communications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Communications</h3>
              <div className="space-y-3">
                {communications.slice(0, 3).map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        comm.priority === 'urgent' ? 'bg-red-500' : 
                        comm.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{comm.subject}</p>
                        <p className="text-sm text-gray-600">From: {comm.fromRole.replace('_', ' ')} | {comm.sentAt.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(comm.priority)}`}>
                      {comm.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h3>
              <div className="space-y-3">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.scheduledDate.toLocaleTimeString()} | {appointment.doctorName} | {appointment.reason}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => handleCheckIn(appointment.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Management</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Detailed appointment management interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Journey Tracking</h2>
            <div className="space-y-6">
              {patientJourneys.map((journey) => (
                <div key={journey.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{journey.patientName}</h3>
                      <p className="text-sm text-gray-600">
                        Current Stage: <span className="font-medium">{journey.currentStage.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Started: {journey.startDate.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                    {journey.stages.map((stage, index) => (
                      <div key={index} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${getJourneyStageColor(stage.status)}`}></div>
                          <p className="text-xs text-gray-600 mt-1 text-center min-w-20">
                            {stage.stage.replace('_', ' ')}
                          </p>
                          {stage.endTime && (
                            <p className="text-xs text-gray-500">
                              {stage.endTime.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        {index < journey.stages.length - 1 && (
                          <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Communication Center</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Multi-stakeholder communication interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Coordination Analytics</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Calendar className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">89</p>
                    <p className="text-sm text-gray-600">Appointments This Month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Clock className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">2.1h</p>
                    <p className="text-sm text-gray-600">Avg Patient Journey Time</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                    <p className="text-sm text-gray-600">Coordination Success Rate</p>
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

export default ClinicCoordinatorDashboard;
