/**
 * API Service for AIPC Frontend
 * Connects to the live backend at https://aipcn.onrender.com
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aipcn.onrender.com';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: any[];
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface SymptomCheckRequest {
  symptoms: string[];
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Try to get token from localStorage
    this.token = localStorage.getItem('aipc_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('aipc_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('aipc_token');
  }

  // Get authentication headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse> {
    const response = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token if login successful
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse> {
    return this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request<any>('/api/auth/profile');
  }

  async updateProfile(updates: Partial<any>): Promise<ApiResponse> {
    return this.request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request<any>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // AI Symptom Checker
  async checkSymptoms(symptomData: SymptomCheckRequest): Promise<ApiResponse> {
    return this.request<any>('/api/symptom-checker', {
      method: 'POST',
      body: JSON.stringify(symptomData),
    });
  }

  // Patient endpoints
  async getPatientProfile(): Promise<ApiResponse> {
    return this.request<any>('/api/patients/me');
  }

  // Order endpoints
  async getOrders(): Promise<ApiResponse> {
    return this.request<any>('/api/orders');
  }

  async getOrderById(orderId: string): Promise<ApiResponse> {
    return this.request<any>(`/api/orders/${orderId}`);
  }

  // Demo endpoints (for testing)
  async getApiInfo(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api`);
    return response.json();
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Demo credentials for easy testing
  static getDemoCredentials() {
    return {
      patient: { email: 'patient1@example.com', password: 'Patient123!' },
      doctor: { email: 'dr.smith@aipc.com', password: 'Doctor123!' },
      admin: { email: 'admin@aipc.com', password: 'Admin123!' },
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  SymptomCheckRequest,
};
