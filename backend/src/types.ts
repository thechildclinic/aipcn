// Backend types can initially mirror frontend types for data passed through the API.
// Over time, they might diverge based on backend-specific needs or data transformations.

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  isMetaSuggestion?: boolean;
}

export interface PatientProfile {
  id?: string; // Add patient ID for database
  name?: string;
  age?: string;
  pastHistory?: string;
  habits?: string;
  // Add other EMR/HIS relevant fields if necessary
  // e.g., contactInfo, insuranceDetails etc.
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  specialty: string;
  distance?: string; // May not be relevant for pure API
  waitTime?: string;  // May not be relevant for pure API
  rating?: number;    // May not be relevant for pure API
  acceptsProvisionalCondition?: (condition: string | null) => boolean; // This logic might move
  doctorName?: string;
  clinicLicense?: string;
}

export interface Appointment {
  id?: string; // Add appointment ID for database
  clinicId: string; // Reference to Clinic
  patientId: string; // Reference to Patient
  dateTime: Date;
  patientSymptomsSummary: string; // Store a summary
  provisionalDiagnosisSummary: string | null;
  // chatHistoryId?: string; // Potentially link to a stored chat history document
}

export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  education?: string; // Education might be generated on demand or stored
  adherenceTips?: string;
}

export interface TestRecommendation {
  name: string;
  reason: string;
  education?: string; // Education might be generated on demand or stored
}

export interface Prescription { // This is the doctor's output, used as input for PharmacyOrder
  id?: string; // Add prescription ID for database
  appointmentId?: string; // Reference to Appointment
  medications: Medication[];
  tests: TestRecommendation[];
  generalAdvice: string;
  doctorNotes?: string;
  doctorName?: string;
  clinicAddress?: string;
  clinicLicense?: string;
  issuedDate?: string; // Changed to string (ISO) to align with frontend and JSON transport
}

export interface ProvisionalDiagnosisResult {
  condition: string | null;
  confidence?: string;
  summaryForPatient: string; // This is for patient display; API might return more raw data for EMR
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

export interface Episode {
  id: string; 
  patientId: string; 
  date: string; 
  initialSymptomsSummary: string;
  provisionalDiagnosisSummary: string;
  clinicId?: string; 
  appointmentId?: string; 
  prescriptionId?: string; 
}

export interface DoctorNoteSuggestion {
  suggestion: string;
  type: 'autocomplete' | 'meta-finding';
}

export interface DDxItem {
  condition: string;
  rationale: string;
}

export interface DDxActionSuggestedMedication {
  name: string;
  typicalDosage: string;
  typicalInstructions: string;
}

export interface DDxActionSuggestedTest {
  name: string;
  reason: string;
}
export interface DDxActionSuggestion {
  suggestedMedications: DDxActionSuggestedMedication[];
  suggestedTests: DDxActionSuggestedTest[];
}

// --- Marketplace & Order Fulfillment Types ---
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
  id: string; // Generated by backend
  businessType: BusinessType;
  businessName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  clinicSpecialties?: string;
  doctorCount?: string;
  labTestTypes?: string;
  labCertifications?: string;
  pharmacyServices?: string;
  prescriptionDelivery?: boolean;
  regulatoryComplianceNotes: string;
  attestedCompliance: boolean;
  serviceRegion?: string;
  status: MarketplaceApplicationStatus;
  submissionDate: string; // ISO string
  // Backend internal fields
  apiKey?: string; // For provider to call back to our system if needed
}

export interface BaseProviderProfile {
  id: string; // Corresponds to an approved MarketplaceApplication.id
  applicationId: string;
  name: string;
  address: string;
  serviceRegions: string[]; // More granular than a single string
  contactEmail: string;
  contactPhone: string;
  website?: string;
  overallRating?: number; // Calculated from user feedback/etc.
  isActive: boolean; // Can be toggled by admin
  // Dynamic operational status
  acceptingNewWork: boolean; 
  currentCapacityLoad?: number; // 0-100%
}

export interface PharmacyProviderProfile extends BaseProviderProfile {
  businessType: BusinessType.PHARMACY;
  servicesOffered: string[]; // e.g., ['Dispensing', 'Compounding', 'Vaccinations']
  offersDelivery: boolean;
  deliveryRadiusKm?: number;
  minOrderValueForFreeDelivery?: number;
  slaComplianceDispenseTimeMinutes?: number; // Avg time to prepare
}

export interface LabProviderProfile extends BaseProviderProfile {
  businessType: BusinessType.LAB;
  testsOfferedDetails: Array<{ testName: string; typicalTurnaroundHours: number; priceRange?: string }>;
  certifications: string[]; // e.g., ['CLIA', 'CAP']
  avgTurnaroundTimeHoursOverall?: number; // Calculated
  acceptsWalkIns?: boolean;
  homeSampleCollectionOffered?: boolean;
}

export type ProviderProfile = PharmacyProviderProfile | LabProviderProfile;


export enum OrderType {
  PHARMACY_PRESCRIPTION = 'PHARMACY_PRESCRIPTION',
  LAB_TEST_REQUEST = 'LAB_TEST_REQUEST',
}

export enum OrderStatus {
  CREATED = 'CREATED', // Initial state, not yet broadcast
  BROADCASTED_AWAITING_BIDS = 'BROADCASTED_AWAITING_BIDS',
  BIDS_RECEIVED_EVALUATING = 'BIDS_RECEIVED_EVALUATING',
  ASSIGNED_TO_PROVIDER = 'ASSIGNED_TO_PROVIDER',
  PROVIDER_ACCEPTED = 'PROVIDER_ACCEPTED', // Provider confirmed they will take it
  PROVIDER_REJECTED = 'PROVIDER_REJECTED', // Provider cannot take it, needs re-broadcast or manual action
  IN_PROGRESS_PREPARATION = 'IN_PROGRESS_PREPARATION', // Pharmacy preparing, Lab scheduling/awaiting sample
  IN_PROGRESS_SAMPLE_COLLECTION = 'IN_PROGRESS_SAMPLE_COLLECTION', // Lab specific
  IN_PROGRESS_PROCESSING = 'IN_PROGRESS_PROCESSING', // Lab specific
  READY_FOR_DISPATCH = 'READY_FOR_DISPATCH', // Pharmacy specific
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Pharmacy specific
  READY_FOR_PICKUP = 'READY_FOR_PICKUP', // Pharmacy specific
  RESULTS_UPLOADED_PENDING_REVIEW = 'RESULTS_UPLOADED_PENDING_REVIEW', // Lab specific
  COMPLETED = 'COMPLETED', // Meds delivered/picked up, Lab results finalized by doctor
  CANCELLED_BY_PATIENT = 'CANCELLED_BY_PATIENT',
  CANCELLED_BY_SYSTEM = 'CANCELLED_BY_SYSTEM', // e.g., no bids, provider issue
}

export interface BaseMarketOrder {
  id: string; // UUID
  orderType: OrderType;
  patientId: string; // Ref to PatientProfile.id (if available) or an anonymous ID
  patientInfoSnapshot: PatientProfile; // Key patient details at time of order
  requestingDoctorSnapshot: Pick<Prescription, 'doctorName' | 'clinicAddress' | 'clinicLicense'>;
  orderCreationTimestamp: string; // ISO
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; timestamp: string; notes?: string }>;
  assignedProviderId?: string; // PharmacyProviderProfile.id or LabProviderProfile.id
  assignedProviderName?: string;
  finalPriceToPatient?: number;
  patientSavingsComparedToRrp?: number;
  lastUpdatedTimestamp: string; // ISO
}

export interface PharmacyOrderDetails extends BaseMarketOrder {
  orderType: OrderType.PHARMACY_PRESCRIPTION;
  prescriptionDetails: Prescription; // The full prescription content
  fulfillmentInfo?: {
    estimatedDeliveryOrPickupTime?: string;
    actualDeliveryOrPickupTime?: string;
    deliveryAddress?: string; // If different from patient profile
    pickupLocation?: string;
    trackingNumber?: string;
    deliveryProvider?: string;
  };
  refillInformation?: {
    isRefillable: boolean;
    numberOfRefillsAllowed?: number;
    refillsRemaining?: number;
    nextRefillDueDate?: string;
  };
}

export interface LabOrderDetails extends BaseMarketOrder {
  orderType: OrderType.LAB_TEST_REQUEST;
  testsRequested: TestRecommendation[]; // List of tests
  preTestInstructionsGenerated?: string; // AI generated or standard
  sampleCollectionDetails?: {
    method: 'AT_LAB' | 'HOME_KIT_DISPATCHED' | 'MOBILE_PHLEBOTOMY';
    scheduledDateTime?: string; // ISO
    labLocationAddress?: string; // If AT_LAB
    kitTrackingNumber?: string; // If HOME_KIT
  };
  resultsInfo?: {
    resultsPdfInternalUrl?: string; // Path to stored PDF after lab uploads
    ocrProcessedText?: string; // For AI analysis
    aiSummaryForDoctor?: string; // Generated by Gemini
    doctorReviewedTimestamp?: string;
    finalReportUrlForPatient?: string; // If shared back
  };
}

export type MarketOrder = PharmacyOrderDetails | LabOrderDetails;

export interface BidDetails {
  id: string; // UUID
  orderId: string; // Ref to MarketOrder.id
  providerId: string; // Ref to ProviderProfile.id
  providerName: string; // For display
  bidAmount: number; // The price offered by the provider
  currency: 'USD'; // Or other applicable currency
  // Pharmacy specific bid details
  estimatedDeliveryTime?: string; // e.g., "ASAP_WITHIN_4_HOURS", "NEXT_MORNING", "STANDARD_2_DAYS", "PICKUP_READY_IN_1_HOUR"
  deliveryFeeIncluded?: boolean;
  // Lab specific bid details
  estimatedTurnaroundTimeForResultsHours?: number; // e.g., 24, 48
  
  notesFromProvider?: string;
  bidTimestamp: string; // ISO
  bidExpiryTimestamp?: string; // ISO, if applicable
  providerMetricsSnapshot: { // Metrics at the time of bid
    overallRating?: number;
    slaCompliance?: number; // e.g., On-time delivery % for pharmacy, TAT compliance for lab
    relevantTestTurnaroundHours?: number; // For lab, specific to tests in order
  };
  isWinningBid?: boolean; // Set after evaluation
}

export interface AlgorithmFactorWeights {
  priceWeight: number;        // e.g., 0.0 to 1.0
  speedWeight: number;        // For delivery/turnaround
  qualityWeight: number;      // Based on ratings, SLA, certifications
  proximityWeight?: number;   // If location matters for patient/delivery (more complex)
  // Ensure weights sum to 1.0 or are normalized during calculation
}


// --- API Request/Response Types ---

// Base for AI interactions
export interface AIInteractionRequest {
  patientProfile?: PatientProfile;
  // Other common context if needed
}

export interface InitialAssessmentRequest extends AIInteractionRequest {
  symptoms: string;
  chatHistory?: ChatMessage[];
}

export interface ProvisionalDiagnosisRequest extends AIInteractionRequest {
  chatHistory: ChatMessage[];
}

export interface GenerateDoctorNotesRequest extends AIInteractionRequest {
    symptoms: string;
    provisionalDiagnosis: string;
    testResultsSummary?: string | null;
}

export interface GeneratePrescriptionRequest extends AIInteractionRequest {
    provisionalDiagnosis: string;
    doctorSummaryForPrescription: string;
    doctorName?: string;
    clinicAddress?: string;
    clinicLicense?: string;
    // patientId?: string; // For linking in DB
    // appointmentId?: string; // For linking in DB
}

export interface SuggestTestsRequest extends AIInteractionRequest {
    provisionalCondition: string;
}

export interface RefineDiagnosisRequest extends AIInteractionRequest {
    provisionalDiagnosis: string;
    testResultsSummary: string;
}

export interface PrescriptionKeywordsRequest extends AIInteractionRequest {
    provisionalDiagnosis: string;
    currentDoctorSummary: string;
}

export interface DoctorNoteSuggestionsRequest extends AIInteractionRequest {
    currentNote: string;
    provisionalDiagnosis: string;
}

export interface DifferentialDiagnosesRequest extends AIInteractionRequest {
    patientSymptoms: string;
    provisionalDiagnosis: string;
    doctorInitialNotes: string;
}

export interface DDxActionsRequest extends AIInteractionRequest {
    selectedDDx: string; 
}

// Marketplace & Order API types
export interface RegisterProviderRequest extends Omit<MarketplaceApplication, 'id' | 'status' | 'submissionDate' | 'apiKey'> {}

export interface BroadcastOrderRequest_Pharmacy {
    patientProfile: PatientProfile;
    prescription: Prescription; // Contains doctor info
}
export interface BroadcastOrderRequest_Lab {
    patientProfile: PatientProfile;
    tests: TestRecommendation[];
    requestingDoctor: Pick<Prescription, 'doctorName' | 'clinicAddress' | 'clinicLicense'>;
}
export type BroadcastOrderResponse = { orderId: string; message: string; broadcastTimestamp: string; };

export interface SubmitBidRequest extends Omit<BidDetails, 'id' | 'orderId' | 'providerName' | 'bidTimestamp' | 'isWinningBid' | 'providerMetricsSnapshot'> {
  // Provider ID will be derived from authenticated user/API key on backend
}
export type SubmitBidResponse = { bidId: string; status: string; receivedTimestamp: string; };

export interface UpdateOrderStatusRequest {
    newStatus: OrderStatus;
    notes?: string;
    // Specific fields for certain statuses
    estimatedDeliveryOrPickupTime?: string; // For pharmacy
    trackingNumber?: string; // For pharmacy delivery
    resultsPdfUrl?: string; // For lab result upload
}
export type UpdateOrderStatusResponse = MarketOrder; // Return updated order

export interface GetAlgorithmFactorsResponse {
    pharmacyFactors: AlgorithmFactorWeights;
    labFactors: AlgorithmFactorWeights;
}
export interface UpdateAlgorithmFactorsRequest {
    type: 'PHARMACY' | 'LAB';
    factors: AlgorithmFactorWeights;
}
export type UpdateAlgorithmFactorsResponse = { success: boolean; updatedFactors: AlgorithmFactorWeights};

export interface UploadLabResultRequest { // Example for PDF upload
    orderId: string;
    // File data would be handled by multipart/form-data middleware like multer
    labNotes?: string;
}
export interface UploadLabResultResponse {
    message: string;
    ocrProcessingQueued?: boolean; // Indicate async processing
    fileId?: string; // Internal reference to the stored file
}

export interface ErrorResponse {
    error: string;
    message?: string;
    details?: any;
}