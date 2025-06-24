
import { ChatMessage, ProvisionalDiagnosisResult, GeneratedQuestion, Medication, TestRecommendation, Prescription, PatientProfile, MetaSymptomQuestion, DoctorNoteSuggestion, DDxItem, DDxActionSuggestion } from '../types';

// SECURITY: All AI calls now go through backend API - no client-side API keys
// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aipcn.onrender.com';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '60000', 10);

// API client configuration
const API_CONFIG = {
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Enhanced API client with better error handling and security
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.defaultHeaders = config.headers;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T | null> {
    const {
      method = 'POST',
      body,
      headers = {},
      timeout = this.timeout
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestHeaders = {
        ...this.defaultHeaders,
        ...headers,
      };

      // Add authentication header if available (will be implemented in Phase 3)
      const authToken = this.getAuthToken();
      if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response, endpoint);
        return null;
      }

      // Handle different response types
      if (endpoint === '/symptom-checker/doctor-notes') {
        return (await response.text()) as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json() as T;
      }

      return (await response.text()) as T;

    } catch (error: any) {
      clearTimeout(timeoutId);
      this.handleNetworkError(error, endpoint, timeout);
      return null;
    }
  }

  private getAuthToken(): string | null {
    // Will be implemented in Phase 3 - Authentication
    // For now, return null
    return null;
  }

  private async handleErrorResponse(response: Response, endpoint: string): Promise<void> {
    let errorData = {
      message: `Request failed with status ${response.status}`,
      status: response.status,
      endpoint
    };

    try {
      const responseText = await response.text();
      if (responseText) {
        try {
          errorData = { ...errorData, ...JSON.parse(responseText) };
        } catch {
          errorData.message = responseText.substring(0, 300);
        }
      }
    } catch {
      // Ignore parsing errors
    }

    console.error(`🚨 API Error (${response.status}) calling ${endpoint}:`, errorData);

    // Show user-friendly error messages
    if (response.status >= 500) {
      this.showUserError('Server error. Please try again later.');
    } else if (response.status === 401) {
      this.showUserError('Authentication required. Please log in.');
    } else if (response.status === 403) {
      this.showUserError('Access denied. Please check your permissions.');
    } else if (response.status === 429) {
      this.showUserError('Too many requests. Please wait a moment and try again.');
    }
  }

  private handleNetworkError(error: any, endpoint: string, timeout: number): void {
    if (error.name === 'AbortError') {
      console.error(`⏱️ API call to ${endpoint} timed out after ${timeout/1000} seconds.`);
      this.showUserError('Request timed out. Please check your connection and try again.');
    } else {
      console.error(`🌐 Network error calling ${endpoint}:`, error);
      this.showUserError('Network error. Please check your connection and try again.');
    }
  }

  private showUserError(message: string): void {
    // Simple error notification - will be enhanced in Phase 6
    if (typeof window !== 'undefined' && window.console) {
      console.warn(`User Error: ${message}`);
    }
    // TODO: Integrate with proper notification system in Phase 6
  }
}

// Create API client instance
const apiClient = new ApiClient(API_CONFIG);


// ===== SYMPTOM CHECKER API FUNCTIONS =====

export const getInitialAssessmentAndQuestion = async (
  symptoms: string,
  chatHistory: ChatMessage[],
  patientProfile?: PatientProfile
): Promise<GeneratedQuestion | null> => {
  const result = await apiClient.request<GeneratedQuestion>('/symptom-checker/initial-assessment', {
    body: { symptoms, chatHistory, patientProfile }
  });

  // Provide fallback response if API fails
  return result || {
    question: "I'm having a little trouble understanding that right now. Could you please try rephrasing, or we can try again in a moment?"
  };
};

export const getProvisionalDiagnosis = async (
  chatHistory: ChatMessage[],
  patientProfile?: PatientProfile
): Promise<ProvisionalDiagnosisResult | null> => {
  const result = await apiClient.request<ProvisionalDiagnosisResult>('/symptom-checker/provisional-diagnosis', {
    body: { chatHistory, patientProfile }
  });

  return result || {
    condition: null,
    confidence: 'error',
    summaryForPatient: "I encountered an issue trying to process the assessment. It would be best to discuss your symptoms directly with a healthcare provider.",
    nextSteps: "Please try finding a clinic or try the assessment again later."
  };
};

export const suggestTestsBasedOnCondition = async (provisionalCondition: string): Promise<string[] | null> => {
  const result = await apiClient.request<string[]>('/symptom-checker/suggest-tests', {
    body: { provisionalCondition }
  });

  return result || []; // Fallback to empty array if API fails
};

export const refineDiagnosisWithTestResults = async (
  provisionalDiagnosis: string,
  testResultsSummary: string,
  patientProfile?: PatientProfile
): Promise<ProvisionalDiagnosisResult | null> => {
  const result = await apiClient.request<ProvisionalDiagnosisResult>('/symptom-checker/refine-diagnosis', {
    body: { provisionalDiagnosis, testResultsSummary, patientProfile }
  });

  if (result) return result;

  // Fallback if API fails
  return {
    condition: provisionalDiagnosis, // Keep original diagnosis
    confidence: 'unchanged', // Indicate no change from AI due to error
    summaryForPatient: "Thank you for uploading your test results. While I had trouble processing them with AI assistance, your doctor will review them carefully.",
    nextSteps: "Please ensure your doctor reviews these results during your consultation."
  };
};

// ===== DOCTOR ASSISTANCE API FUNCTIONS =====

export const generateDoctorNotes = async (
  symptoms: string,
  provisionalDiagnosis: string,
  patientProfile?: PatientProfile,
  testResultsSummary?: string | null
): Promise<string | null> => {
  try {
    const result = await apiClient.request<string>('/symptom-checker/doctor-notes', {
      body: { symptoms, provisionalDiagnosis, patientProfile, testResultsSummary }
    });

    return result || "Error: Could not generate doctor notes at this time (API call failed).";
  } catch (error) {
    console.error("Network or other error calling /symptom-checker/doctor-notes from service:", error);
    return "Error: Could not connect to generate doctor notes.";
  }
};

export const generateDoctorNoteSuggestions = async (
  currentNote: string,
  provisionalDiagnosis: string,
  patientProfile?: PatientProfile
): Promise<DoctorNoteSuggestion[] | null> => {
  const result = await apiClient.request<DoctorNoteSuggestion[]>('/doctor-assist/note-suggestions', {
    body: { currentNote, provisionalDiagnosis, patientProfile }
  });

  return result || []; // Fallback to empty array
};

export const generateDifferentialDiagnoses = async (
  patientSymptoms: string,
  provisionalDiagnosis: string,
  doctorInitialNotes: string,
  patientProfile?: PatientProfile
): Promise<DDxItem[] | null> => {
  const result = await apiClient.request<DDxItem[]>('/doctor-assist/ddx', {
    body: { patientSymptoms, provisionalDiagnosis, doctorInitialNotes, patientProfile }
  });

  return result || null; // Or an empty array if that's preferred: []
};

export const suggestActionsForDDx = async (
  selectedDDx: string,
  patientProfile?: PatientProfile
): Promise<DDxActionSuggestion | null> => {
  const result = await apiClient.request<DDxActionSuggestion>('/doctor-assist/ddx-actions', {
    body: { selectedDDx, patientProfile }
  });

  return result || { suggestedMedications: [], suggestedTests: [] }; // Fallback to empty structure
};

// ===== PRESCRIPTION API FUNCTIONS =====

export const generatePrescriptionKeywords = async (
  provisionalDiagnosis: string,
  currentDoctorSummary: string
): Promise<string[] | null> => {
  const result = await apiClient.request<string[]>('/prescription/keywords', {
    body: { provisionalDiagnosis, currentDoctorSummary }
  });

  return result || []; // Fallback to empty array
};

export const generatePrescriptionWithEducation = async (
  provisionalDiagnosis: string,
  doctorSummaryForPrescription: string,
  doctorName?: string,
  clinicAddress?: string,
  clinicLicense?: string
): Promise<Prescription | null> => {
  const result = await apiClient.request<Prescription>('/prescription/generate-full', {
    body: {
      provisionalDiagnosis,
      doctorSummaryForPrescription,
      doctorName,
      clinicAddress,
      clinicLicense
    }
  });

  return result || null; // Fallback to null
};
