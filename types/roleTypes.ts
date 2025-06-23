// Role-Based System Types for AIPC Healthcare Ecosystem

export type UserRole = 'doctor' | 'pharmacy_manager' | 'lab_manager' | 'clinic_coordinator' | 'patient' | 'marketplace_manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  profileImage?: string;
  subscriptionTier?: 'basic' | 'premium'; // For patients
  medicalHistory?: string[]; // For patients
  currentConditions?: string[]; // For patients
}

// Pharmacy Manager Types
export interface PrescriptionOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  medications: OrderMedication[];
  orderDate: Date;
  urgency: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'bidding' | 'accepted' | 'processing' | 'ready' | 'delivered' | 'completed';
  specialInstructions?: string;
  insuranceInfo?: string;
  deliveryAddress: string;
  contactNumber: string;
}

export interface OrderMedication {
  name: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  genericAllowed: boolean;
  refills: number;
}

export interface PharmacyBid {
  id: string;
  orderId: string;
  pharmacyId: string;
  pharmacyName: string;
  totalPrice: number;
  estimatedPreparationTime: number; // minutes
  deliveryTimeframe: string;
  availabilityStatus: 'in_stock' | 'partial_stock' | 'order_required';
  notes?: string;
  submittedAt: Date;
  expiresAt: Date;
}

export interface DeliveryTracking {
  id: string;
  orderId: string;
  status: 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'failed';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveryMethod: 'pickup' | 'home_delivery' | 'courier';
  trackingNumber?: string;
  deliveryNotes?: string;
}

// Laboratory Manager Types
export interface LabTestOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  tests: OrderedTest[];
  orderDate: Date;
  urgency: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'scheduled' | 'sample_collected' | 'processing' | 'completed' | 'reported';
  clinicalInfo?: string;
  fastingRequired: boolean;
  specialInstructions?: string;
  appointmentDate?: Date;
  sampleCollectionDate?: Date;
}

export interface OrderedTest {
  testCode: string;
  testName: string;
  category: string;
  sampleType: 'blood' | 'urine' | 'stool' | 'swab' | 'tissue' | 'other';
  fastingRequired: boolean;
  estimatedTurnaroundTime: number; // hours
  urgency: 'routine' | 'urgent' | 'stat';
}

export interface LabResult {
  id: string;
  testOrderId: string;
  testCode: string;
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  performedDate: Date;
  reportedDate?: Date;
  technician: string;
  reviewedBy?: string;
  notes?: string;
}

export interface QualityControlCheck {
  id: string;
  testOrderId: string;
  checkType: 'sample_quality' | 'result_verification' | 'critical_value' | 'reference_range';
  status: 'passed' | 'failed' | 'requires_review';
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

// Clinic Coordinator Types
export interface PatientAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'lab_review';
  scheduledDate: Date;
  duration: number; // minutes
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PatientJourney {
  id: string;
  patientId: string;
  patientName: string;
  currentStage: 'registration' | 'consultation' | 'lab_ordered' | 'lab_pending' | 'prescription_ordered' | 'prescription_pending' | 'follow_up_scheduled' | 'completed';
  stages: JourneyStage[];
  startDate: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  coordinatorNotes?: string;
}

export interface JourneyStage {
  stage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  assignedTo?: string;
  notes?: string;
  documents?: string[];
}

export interface CommunicationLog {
  id: string;
  patientId: string;
  fromRole: UserRole;
  toRole: UserRole;
  fromUserId: string;
  toUserId: string;
  messageType: 'appointment' | 'lab_result' | 'prescription' | 'follow_up' | 'emergency' | 'general';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'responded';
  sentAt: Date;
  readAt?: Date;
  attachments?: string[];
}

// Notification System Types
export interface Notification {
  id: string;
  userId: string;
  type: 'order_received' | 'bid_submitted' | 'result_ready' | 'appointment_scheduled' | 'urgent_alert' | 'system_update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// Analytics & Reporting Types
export interface PerformanceMetrics {
  userId: string;
  role: UserRole;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  metrics: {
    [key: string]: number | string;
  };
  generatedAt: Date;
}

export interface WorkflowTask {
  id: string;
  assignedTo: string;
  taskType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// Patient-Specific Types
export interface HealthMessage {
  id: string;
  patientId: string;
  type: 'medication_reminder' | 'health_tip' | 'appointment_reminder' | 'wellness_content' | 'test_result_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  relatedCondition?: string;
}

export interface PersonalHealthRecord {
  id: string;
  patientId: string;
  medicalHistory: MedicalHistoryEntry[];
  testResults: TestResultEntry[];
  prescriptions: PrescriptionEntry[];
  appointments: AppointmentEntry[];
  allergies: string[];
  currentMedications: string[];
  emergencyContacts: EmergencyContact[];
  insuranceInfo?: InsuranceInfo;
}

export interface MedicalHistoryEntry {
  id: string;
  date: Date;
  condition: string;
  diagnosis: string;
  treatment: string;
  provider: string;
  notes?: string;
}

export interface TestResultEntry {
  id: string;
  date: Date;
  testName: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  orderingPhysician: string;
  lab: string;
  notes?: string;
}

export interface PrescriptionEntry {
  id: string;
  date: Date;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribingPhysician: string;
  pharmacy?: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface AppointmentEntry {
  id: string;
  date: Date;
  provider: string;
  specialty: string;
  reason: string;
  outcome?: string;
  followUpRequired: boolean;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  copay?: number;
  deductible?: number;
}

export interface MarketplaceOffer {
  id: string;
  providerId: string;
  providerName: string;
  offerType: 'discount' | 'promotion' | 'service' | 'package';
  title: string;
  description: string;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  validUntil: Date;
  conditions: string[];
  targetPatientConditions?: string[];
  subscriptionTierRequired?: 'basic' | 'premium';
  isActive: boolean;
}

// Marketplace Manager Types
export interface NetworkProvider {
  id: string;
  name: string;
  type: 'clinic' | 'pharmacy' | 'lab';
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  joinDate: Date;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  services: string[];
  performanceMetrics: {
    rating: number;
    completedOrders: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  };
  commissionRate: number;
  contractTerms: string;
}

export interface CommissionStructure {
  id: string;
  providerType: 'clinic' | 'pharmacy' | 'lab';
  serviceType: string;
  commissionRate: number;
  minimumVolume?: number;
  bonusThresholds?: {
    volume: number;
    bonusRate: number;
  }[];
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface BusinessRule {
  id: string;
  name: string;
  type: 'routing' | 'pricing' | 'sla' | 'quality';
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: string | number;
  }[];
  actions: {
    type: string;
    value: string | number;
  }[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface NetworkPerformance {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  totalRevenue: number;
  totalCommissions: number;
  orderVolume: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  providerPerformance: {
    providerId: string;
    providerName: string;
    revenue: number;
    orders: number;
    rating: number;
  }[];
  topPerformingServices: string[];
  issuesResolved: number;
  pendingDisputes: number;
}

export interface Dispute {
  id: string;
  type: 'service_quality' | 'billing' | 'delivery' | 'communication' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedBy: {
    userId: string;
    userType: UserRole;
    name: string;
  };
  reportedAgainst: {
    providerId: string;
    providerName: string;
    providerType: 'clinic' | 'pharmacy' | 'lab';
  };
  description: string;
  evidence?: string[];
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
}

// Test User Accounts for Demo
export const testUsers: User[] = [
  {
    id: 'doc_001',
    email: 'dr.smith@cardiaccare.com',
    name: 'Dr. Sarah Smith',
    role: 'doctor',
    organizationId: 'clinic_001',
    organizationName: 'Cardiac Care Specialists',
    permissions: ['diagnose', 'prescribe', 'order_labs', 'view_results'],
    isActive: true
  },
  {
    id: 'pharm_001',
    email: 'manager@quickrx.com',
    name: 'Michael Johnson',
    role: 'pharmacy_manager',
    organizationId: 'pharmacy_001',
    organizationName: 'QuickRx Pharmacy',
    permissions: ['manage_orders', 'submit_bids', 'process_prescriptions', 'manage_delivery'],
    isActive: true
  },
  {
    id: 'lab_001',
    email: 'supervisor@precisionlab.com',
    name: 'Dr. Lisa Chen',
    role: 'lab_manager',
    organizationId: 'lab_001',
    organizationName: 'Precision Diagnostics Lab',
    permissions: ['manage_test_orders', 'input_results', 'quality_control', 'generate_reports'],
    isActive: true
  },
  {
    id: 'coord_001',
    email: 'coordinator@healthhub.com',
    name: 'Jennifer Martinez',
    role: 'clinic_coordinator',
    organizationId: 'clinic_001',
    organizationName: 'HealthHub Medical Center',
    permissions: ['manage_appointments', 'coordinate_care', 'track_patients', 'communicate'],
    isActive: true
  },
  {
    id: 'patient_001',
    email: 'john.doe@email.com',
    name: 'John Doe',
    role: 'patient',
    organizationId: 'patient_org',
    organizationName: 'AIPC Patient Portal',
    permissions: ['view_records', 'book_appointments', 'message_providers', 'access_marketplace'],
    isActive: true,
    subscriptionTier: 'premium',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    currentConditions: ['Hypertension', 'Type 2 Diabetes']
  },
  {
    id: 'patient_002',
    email: 'jane.smith@email.com',
    name: 'Jane Smith',
    role: 'patient',
    organizationId: 'patient_org',
    organizationName: 'AIPC Patient Portal',
    permissions: ['view_records', 'book_appointments'],
    isActive: true,
    subscriptionTier: 'basic',
    medicalHistory: ['Asthma'],
    currentConditions: ['Asthma']
  },
  {
    id: 'marketplace_001',
    email: 'admin@aipc-marketplace.com',
    name: 'Sarah Johnson',
    role: 'marketplace_manager',
    organizationId: 'aipc_marketplace',
    organizationName: 'AIPC Marketplace',
    permissions: ['manage_network', 'set_commissions', 'resolve_disputes', 'view_analytics', 'approve_providers'],
    isActive: true
  }
];

export default {
  UserRole,
  User,
  PrescriptionOrder,
  LabTestOrder,
  PatientAppointment,
  PatientJourney,
  testUsers
};
