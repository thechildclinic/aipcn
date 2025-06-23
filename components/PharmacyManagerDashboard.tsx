import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { PrescriptionOrder, PharmacyBid, DeliveryTracking, User } from '../types/roleTypes';

interface PharmacyManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

const PharmacyManagerDashboard: React.FC<PharmacyManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'bids' | 'processing' | 'delivery' | 'analytics'>('orders');
  const [orders, setOrders] = useState<PrescriptionOrder[]>([]);
  const [bids, setBids] = useState<PharmacyBid[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PrescriptionOrder | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

  // Sample data for demonstration
  useEffect(() => {
    const sampleOrders: PrescriptionOrder[] = [
      {
        id: 'RX001',
        patientId: 'P001',
        patientName: 'Robert Chen',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        clinicName: 'Cardiac Care Specialists',
        medications: [
          {
            name: 'Atorvastatin',
            dosage: '40mg',
            quantity: 30,
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take with evening meal',
            genericAllowed: true,
            refills: 5
          },
          {
            name: 'Metoprolol',
            dosage: '50mg',
            quantity: 60,
            frequency: 'Twice daily',
            duration: '30 days',
            instructions: 'Take with food',
            genericAllowed: true,
            refills: 5
          }
        ],
        orderDate: new Date('2024-01-15'),
        urgency: 'routine',
        status: 'pending',
        deliveryAddress: '123 Main St, City, State 12345',
        contactNumber: '(555) 123-4567'
      },
      {
        id: 'RX002',
        patientId: 'P002',
        patientName: 'Maria Rodriguez',
        doctorId: 'D001',
        doctorName: 'Dr. Sarah Smith',
        clinicName: 'Cardiac Care Specialists',
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            quantity: 30,
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take in morning',
            genericAllowed: true,
            refills: 3
          }
        ],
        orderDate: new Date('2024-01-16'),
        urgency: 'urgent',
        status: 'bidding',
        deliveryAddress: '456 Oak Ave, City, State 12345',
        contactNumber: '(555) 987-6543'
      }
    ];
    setOrders(sampleOrders);
  }, []);

  const handleSubmitBid = (orderId: string, bidData: Partial<PharmacyBid>) => {
    const newBid: PharmacyBid = {
      id: `BID_${Date.now()}`,
      orderId,
      pharmacyId: user.organizationId,
      pharmacyName: user.organizationName,
      totalPrice: bidData.totalPrice || 0,
      estimatedPreparationTime: bidData.estimatedPreparationTime || 30,
      deliveryTimeframe: bidData.deliveryTimeframe || 'Same day',
      availabilityStatus: bidData.availabilityStatus || 'in_stock',
      notes: bidData.notes,
      submittedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    setBids(prev => [...prev, newBid]);
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'bidding' } : order
    ));
    setShowBidModal(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'bidding': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'routine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'orders', label: 'New Orders', icon: Icons.ShoppingCart, count: orders.filter(o => o.status === 'pending').length },
    { id: 'bids', label: 'My Bids', icon: Icons.DollarSign, count: bids.length },
    { id: 'processing', label: 'Processing', icon: Icons.Package, count: orders.filter(o => ['accepted', 'processing'].includes(o.status)).length },
    { id: 'delivery', label: 'Delivery', icon: Icons.Truck, count: deliveries.length },
    { id: 'analytics', label: 'Analytics', icon: Icons.BarChart, count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Icons.Pill className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Manager</h1>
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
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
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
              <h2 className="text-xl font-semibold text-gray-900">New Prescription Orders</h2>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option>All Urgency</option>
                  <option>Emergency</option>
                  <option>Urgent</option>
                  <option>Routine</option>
                </select>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Bidding</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {orders.filter(order => ['pending', 'bidding'].includes(order.status)).map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
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
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        View Details
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowBidModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Submit Bid
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Medications ({order.medications.length})</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {order.medications.map((med, index) => (
                        <div key={index} className="bg-gray-50 rounded p-3">
                          <p className="font-medium text-gray-900">{med.name} {med.dosage}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {med.quantity} | {med.frequency} | {med.duration}
                          </p>
                          <p className="text-xs text-gray-500">{med.instructions}</p>
                          {med.genericAllowed && (
                            <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Generic OK
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Delivery Address:</span><br />
                          {order.deliveryAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Contact:</span> {order.contactNumber}
                        </p>
                        {order.specialInstructions && (
                          <p className="text-gray-600 mt-2">
                            <span className="font-medium">Special Instructions:</span><br />
                            {order.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs content would be implemented similarly */}
        {activeTab === 'bids' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Submitted Bids</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Bid management interface would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'processing' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Orders in Processing</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Order processing workflow would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Management</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Delivery tracking and management would be implemented here...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Analytics</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-gray-600">Orders This Month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">$12,450</p>
                    <p className="text-sm text-gray-600">Revenue This Month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Icons.Clock className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">2.3h</p>
                    <p className="text-sm text-gray-600">Avg Processing Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bid Submission Modal */}
      {showBidModal && selectedOrder && (
        <BidSubmissionModal
          order={selectedOrder}
          onSubmit={(bidData) => handleSubmitBid(selectedOrder.id, bidData)}
          onClose={() => {
            setShowBidModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

// Bid Submission Modal Component
interface BidSubmissionModalProps {
  order: PrescriptionOrder;
  onSubmit: (bidData: Partial<PharmacyBid>) => void;
  onClose: () => void;
}

const BidSubmissionModal: React.FC<BidSubmissionModalProps> = ({ order, onSubmit, onClose }) => {
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [preparationTime, setPreparationTime] = useState<number>(30);
  const [deliveryTimeframe, setDeliveryTimeframe] = useState<string>('Same day');
  const [availabilityStatus, setAvailabilityStatus] = useState<'in_stock' | 'partial_stock' | 'order_required'>('in_stock');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      totalPrice,
      estimatedPreparationTime: preparationTime,
      deliveryTimeframe,
      availabilityStatus,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Submit Bid for Order #{order.id}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Timeframe
                </label>
                <select
                  value={deliveryTimeframe}
                  onChange={(e) => setDeliveryTimeframe(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Same day">Same day</option>
                  <option value="Next day">Next day</option>
                  <option value="2-3 days">2-3 days</option>
                  <option value="3-5 days">3-5 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in_stock">All in stock</option>
                  <option value="partial_stock">Partial stock</option>
                  <option value="order_required">Need to order</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information about this bid..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Bid
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PharmacyManagerDashboard;
