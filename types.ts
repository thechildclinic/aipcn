// Re-export UserRole from roleTypes
export type { UserRole, User } from './types/roleTypes';
export { testUsers } from './types/roleTypes';

export enum AppStage {
  WELCOME,
  PATIENT_PROFILE, // New stage for collecting patient profile
  SYMPTOM_INPUT_CHAT,
  CLINIC_SELECTION,
  BOOKING_CONFIRMATION,
  DOCTOR_PATIENT_VIEW,
  INTERACTION_HISTORY, // New stage/view for past interactions
  PHARMACY_ORDER_VIEW, // New stage for pharmacy
  LAB_ORDER_VIEW,      // New stage for lab
  MARKETPLACE_WELCOME, // New: For businesses to start onboarding
  MARKETPLACE_ONBOARDING_FORM, // New: Form for business details
  MARKETPLACE_CONFIRMATION, // New: Confirmation of submission
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  isMetaSuggestion?: boolean; 
}

export interface PatientProfile {
  name?: string; // Added patient's name
  age?: string; 
  pastHistory?: string;
  habits?: string;
}

// Clinic Specialization Types
export type ClinicSpecialty =
  | 'General Practice'
  | 'Cardiology'
  | 'Dermatology'
  | 'Orthopedics'
  | 'Psychiatry'
  | 'Pediatrics'
  | 'Gynecology'
  | 'Neurology'
  | 'Gastroenterology'
  | 'Endocrinology'
  | 'Pulmonology'
  | 'Rheumatology'
  | 'Oncology'
  | 'Ophthalmology'
  | 'ENT'
  | 'Urology'
  | 'Emergency Medicine';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  specialty: ClinicSpecialty;
  distance: string;
  waitTime: string; 
  rating: number; 
  acceptsProvisionalCondition: (condition: string | null) => boolean;
  doctorName?: string;
  clinicLicense?: string;
}

export interface Appointment {
  clinic: Clinic;
  dateTime: Date;
  patientSymptoms: string;
  provisionalDiagnosis: string | null;
  patientProfile?: PatientProfile;
}

export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  education: string;
  adherenceTips: string;
}

export interface TestRecommendation {
  name: string;
  reason: string;
  education: string;
}

export interface Prescription {
  medications: Medication[];
  tests: TestRecommendation[];
  generalAdvice: string;
  doctorNotes?: string; 
  doctorName?: string;
  clinicAddress?: string;
  clinicLicense?: string;
}

export interface ProvisionalDiagnosisResult {
  condition: string | null;
  confidence?: string; 
  summaryForPatient: string; 
  nextSteps?: string; 
}

export interface MetaSymptomQuestion {
  prompt: string; 
  options: string[]; 
}

export interface GeneratedQuestion {
  question: string; 
  isFinal?: boolean; 
  metaSymptomQuestions?: MetaSymptomQuestion[]; 
}

export enum PrescriptionTab {
  FORMAL = 'Formal Prescription',
  EDUCATION = 'Patient Education',
}

// For storing interaction history
export interface Episode {
  id: string;
  date: string; // ISO string
  patientName?: string; // From profile
  initialSymptomsSummary: string;
  provisionalDiagnosisSummary: string; // e.g., "Condition: Gastritis, Confidence: Medium"
  clinicName?: string; // If clinic was selected
  prescriptionSummary?: string; // e.g., "Meds: Amoxicillin. Tests: CBC."
}

// For Doctor's AI Assistance
export interface DoctorNoteSuggestion {
  suggestion: string; // The text of the suggestion
  type: 'autocomplete' | 'meta-finding'; // Type of suggestion
}

export interface DDxItem {
  condition: string; // Name of the differential diagnosis
  rationale: string; // Brief rationale for this DDx
}

export interface DDxActionSuggestedMedication {
  name: string;
  typicalDosage: string;
  typicalInstructions: string; // Brief instruction, main education generated later
}

export interface DDxActionSuggestedTest {
  name: string;
  reason: string; // Brief reason, main education generated later
}
export interface DDxActionSuggestion {
  suggestedMedications: DDxActionSuggestedMedication[];
  suggestedTests: DDxActionSuggestedTest[];
}

// Enhanced Prescription Safety Types
export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
  alternatives?: string[];
}

export interface EnhancedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  ageAdjusted?: boolean;
  weightBased?: boolean;
  renalAdjustment?: boolean;
  hepaticAdjustment?: boolean;
  contraindications?: string[];
  sideEffects?: string[];
  patientEducation?: string[];
}

export interface PrescriptionSafetyCheck {
  interactions: DrugInteraction[];
  allergies: string[];
  contraindications: string[];
  dosageAlerts: string[];
  monitoringRequirements: string[];
}

// Clinical Decision Support Types
export interface EvidenceBasedProtocol {
  condition: string;
  specialty: ClinicSpecialty;
  medications: EnhancedMedication[];
  diagnosticTests: string[];
  monitoringSchedule: string[];
  patientEducation: string[];
  followUpRecommendations: string[];
}

export interface AutomatedTreatmentPlan {
  diagnosis: string;
  specialty: ClinicSpecialty;
  protocol: EvidenceBasedProtocol;
  customizations: string[];
  doctorApprovalRequired: boolean;
  auditTrail: {
    generated: Date;
    modified?: Date;
    approvedBy?: string;
    modifications?: string[];
  };
}

// For Marketplace Onboarding
export enum BusinessType {
  CLINIC = 'Clinic',
  LAB = 'Laboratory',
  PHARMACY = 'Pharmacy',
}

export enum MarketplaceApplicationStatus {
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface MarketplaceApplication {
  id?: string; // Generated by backend
  businessType: BusinessType;
  businessName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  // Clinic specific
  clinicSpecialties?: string;
  doctorCount?: string; // Stored as string from input
  // Lab specific
  labTestTypes?: string;
  labCertifications?: string;
  // Pharmacy specific
  pharmacyServices?: string;
  prescriptionDelivery?: boolean;
  // Common
  regulatoryComplianceNotes: string;
  attestedCompliance: boolean;
  serviceRegion?: string;
  status?: MarketplaceApplicationStatus; // Managed by backend
  submissionDate?: string; // ISO string, set by backend
}

// Detailed Provider Profiles (for marketplace entities once approved)
export interface PharmacyProvider {
  id: string; // Corresponds to an approved MarketplaceApplication
  name: string;
  address: string;
  serviceRegion: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  servicesOffered: string[]; // e.g., ['Prescription Dispensing', 'Vaccinations', 'OTC Sales']
  offersDelivery: boolean;
  averageRating?: number; // 0-5
  slaCompliance?: number; // 0-100%
  // Dynamic bidding related info (conceptual, managed by backend)
  currentBidCapacity?: number; 
  acceptingNewOrders?: boolean;
}

export interface LabProvider {
  id: string;
  name: string;
  address: string;
  serviceRegion: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  testsOffered: string[]; // e.g., ['CBC', 'Lipid Panel', 'Urinalysis']
  certifications: string[];
  averageRating?: number; // 0-5
  avgTurnaroundTimeHours?: number;
  qualityScore?: string; // e.g., "A+", "High"
  // Dynamic bidding related info
  currentCapacity?: number;
  acceptingNewSamples?: boolean;
}

// Order and Bidding Types
export enum OrderStatus {
  PENDING_BROADCAST = 'Pending Broadcast',
  AWAITING_BIDS = 'Awaiting Bids',
  BIDS_RECEIVED = 'Bids Received',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress', // e.g., Pharmacy preparing, Lab sample received/processing
  OUT_FOR_DELIVERY = 'Out for Delivery',
  READY_FOR_PICKUP = 'Ready for Pickup',
  COMPLETED = 'Completed', // Meds delivered/picked up, Lab results sent
  CANCELLED = 'Cancelled',
}

export interface BaseOrder {
  id: string; // UUID generated by backend
  patientProfile: PatientProfile; // Snapshot or reference
  requestingDoctor: Pick<Prescription, 'doctorName' | 'clinicAddress' | 'clinicLicense'>;
  orderDate: string; // ISO string
  status: OrderStatus;
  assignedProviderId?: string; // PharmacyProvider.id or LabProvider.id
  lastUpdate: string; // ISO string
}

export interface PharmacyOrder extends BaseOrder {
  type: 'PHARMACY';
  prescription: Prescription; // The core medication list
  fulfillmentDetails?: {
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    pickupLocation?: string;
    trackingLink?: string;
  };
}

export interface LabOrder extends BaseOrder {
  type: 'LAB';
  tests: TestRecommendation[]; // The core test list
  preTestInstructions?: string; // Can be AI generated or standard
  sampleCollectionInfo?: string; // e.g., "Home kit dispatched", "Scheduled at Lab X on Date"
  resultsPdfUrl?: string; // Conceptual URL to uploaded PDF
  resultSummaryForDoctor?: string; // AI generated summary after OCR
}

export type Order = PharmacyOrder | LabOrder;

export interface Bid {
  id: string; // UUID generated by backend
  orderId: string;
  providerId: string; // PharmacyProvider.id or LabProvider.id
  providerName: string; // For easy display
  bidAmount: number;
  // Pharmacy specific
  estimatedDeliveryTime?: string; // e.g., "Today PM", "Tomorrow AM", "2 days"
  // Lab specific
  estimatedTurnaroundTime?: string; // e.g., "24 hours", "48 hours"
  
  notes?: string; // Provider's notes on the bid
  timestamp: string; // ISO string
  qualityMetrics?: { // Snapshot of provider's metrics at time of bid
    rating?: number;
    sla?: number;
    qualityScore?: string;
  }
}

// Algorithm Configuration
export interface AlgorithmFactorWeights {
  priceWeight: number; // e.g., 0.6 (representing 60%)
  speedWeight: number; // e.g., 0.2
  qualityWeight: number; // e.g., 0.2
  // Ensure sum to 1, or normalize during calculation
}