import { samplePatients, testScenarios, drugInteractionEdgeCases } from '../data/samplePatients';
import { ClinicSpecialty } from '../types';

// API Base URL for testing
const API_BASE_URL = 'http://localhost:3001/api';

// Test Results Interface
interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  responseTime: number;
  actualResponse?: any;
  expectedCriteria?: any;
}

// Comprehensive AIPC Test Suite
export class AIPCTestSuite {
  private results: TestResult[] = [];

  // Helper method to make API calls
  private async makeAPICall(endpoint: string, body: any): Promise<{ response: any; responseTime: number }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      }
      
      return { response: data, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw new Error(`Network Error: ${error.message} (${responseTime}ms)`);
    }
  }

  // Test 1: Specialty-Aware Diagnosis Testing
  async testSpecialtyAwareDiagnosis(): Promise<void> {
    console.log('🧪 Testing Specialty-Aware Diagnosis...');
    
    for (const [specialty, scenarios] of Object.entries(testScenarios)) {
      for (const scenario of scenarios) {
        const patient = samplePatients.find(p => p.name === scenario.patientId);
        if (!patient) continue;

        try {
          const { response, responseTime } = await this.makeAPICall('/doctor-assist/specialty-diagnosis', {
            symptoms: scenario.symptoms,
            chatHistory: [],
            patientProfile: patient,
            clinicSpecialty: specialty.charAt(0).toUpperCase() + specialty.slice(1)
          });

          const passed = this.validateDiagnosisResponse(response, scenario);
          
          this.results.push({
            testName: `Specialty Diagnosis - ${specialty} - ${scenario.patientId}`,
            passed,
            details: passed ? 'Diagnosis response meets criteria' : 'Diagnosis response failed validation',
            responseTime,
            actualResponse: response,
            expectedCriteria: scenario
          });

        } catch (error) {
          this.results.push({
            testName: `Specialty Diagnosis - ${specialty} - ${scenario.patientId}`,
            passed: false,
            details: `Error: ${error.message}`,
            responseTime: 0
          });
        }
      }
    }
  }

  // Test 2: Drug Interaction Checking
  async testDrugInteractions(): Promise<void> {
    console.log('💊 Testing Drug Interaction Checking...');
    
    for (const edgeCase of drugInteractionEdgeCases) {
      try {
        const { response, responseTime } = await this.makeAPICall('/doctor-assist/drug-interactions', {
          medications: edgeCase.medications,
          patientProfile: edgeCase.patientProfile,
          currentMedications: edgeCase.patientProfile?.currentMedications?.split(', ') || []
        });

        const passed = this.validateDrugInteractionResponse(response, edgeCase);
        
        this.results.push({
          testName: `Drug Interactions - ${edgeCase.scenario}`,
          passed,
          details: passed ? 'Interaction checking meets criteria' : 'Interaction checking failed validation',
          responseTime,
          actualResponse: response,
          expectedCriteria: edgeCase
        });

      } catch (error) {
        this.results.push({
          testName: `Drug Interactions - ${edgeCase.scenario}`,
          passed: false,
          details: `Error: ${error.message}`,
          responseTime: 0
        });
      }
    }
  }

  // Test 3: Automated Treatment Plans
  async testAutomatedTreatmentPlans(): Promise<void> {
    console.log('🤖 Testing Automated Treatment Plans...');
    
    const treatmentTestCases = [
      { diagnosis: 'Hypertension', specialty: 'Cardiology', patient: samplePatients[1] },
      { diagnosis: 'Atopic Dermatitis', specialty: 'Dermatology', patient: samplePatients[2] },
      { diagnosis: 'Osteoarthritis', specialty: 'Orthopedics', patient: samplePatients[5] },
      { diagnosis: 'Major Depressive Disorder', specialty: 'Psychiatry', patient: samplePatients[6] }
    ];

    for (const testCase of treatmentTestCases) {
      try {
        const { response, responseTime } = await this.makeAPICall('/doctor-assist/automated-treatment-plan', {
          confirmedDiagnosis: testCase.diagnosis,
          clinicSpecialty: testCase.specialty,
          patientProfile: testCase.patient,
          clinicalNotes: `Patient diagnosed with ${testCase.diagnosis}`
        });

        const passed = this.validateTreatmentPlanResponse(response, testCase);
        
        this.results.push({
          testName: `Treatment Plan - ${testCase.specialty} - ${testCase.diagnosis}`,
          passed,
          details: passed ? 'Treatment plan meets criteria' : 'Treatment plan failed validation',
          responseTime,
          actualResponse: response,
          expectedCriteria: testCase
        });

      } catch (error) {
        this.results.push({
          testName: `Treatment Plan - ${testCase.specialty} - ${testCase.diagnosis}`,
          passed: false,
          details: `Error: ${error.message}`,
          responseTime: 0
        });
      }
    }
  }

  // Test 4: Enhanced Note-Taking Features
  async testEnhancedNoteFeatures(): Promise<void> {
    console.log('📝 Testing Enhanced Note-Taking Features...');
    
    const noteTestCases = [
      {
        feature: 'Contextual Autocomplete',
        endpoint: '/doctor-assist/autocomplete',
        body: {
          currentText: 'Patient presents with chest pain and',
          currentWord: 'and',
          provisionalDiagnosis: 'Acute Coronary Syndrome',
          patientProfile: samplePatients[0]
        }
      },
      {
        feature: 'Smart Suggestions',
        endpoint: '/doctor-assist/smart-suggestions',
        body: {
          currentText: 'Patient c/o headache, started 2 days ago',
          provisionalDiagnosis: 'tension headache',
          patientProfile: samplePatients[1]
        }
      },
      {
        feature: 'Note Summarization',
        endpoint: '/doctor-assist/summarize-notes',
        body: {
          rawNotes: 'Patient c/o chest pain, SOB. Exam: elevated BP, clear lungs. Plan: ECG, troponins, cardiology consult.',
          provisionalDiagnosis: 'Acute Coronary Syndrome',
          patientProfile: samplePatients[0]
        }
      }
    ];

    for (const testCase of noteTestCases) {
      try {
        const { response, responseTime } = await this.makeAPICall(testCase.endpoint, testCase.body);

        const passed = this.validateNoteFeatureResponse(response, testCase.feature);
        
        this.results.push({
          testName: `Note Feature - ${testCase.feature}`,
          passed,
          details: passed ? 'Note feature response meets criteria' : 'Note feature failed validation',
          responseTime,
          actualResponse: response
        });

      } catch (error) {
        this.results.push({
          testName: `Note Feature - ${testCase.feature}`,
          passed: false,
          details: `Error: ${error.message}`,
          responseTime: 0
        });
      }
    }
  }

  // Validation Methods
  private validateDiagnosisResponse(response: any, scenario: any): boolean {
    return !!(
      response.condition &&
      response.confidence &&
      response.summaryForPatient &&
      response.nextSteps &&
      response.condition.length > 10 &&
      response.summaryForPatient.length > 50
    );
  }

  private validateDrugInteractionResponse(response: any, edgeCase: any): boolean {
    return !!(
      response.interactions &&
      Array.isArray(response.interactions) &&
      response.allergies &&
      response.contraindications &&
      response.dosageAlerts &&
      response.monitoringRequirements
    );
  }

  private validateTreatmentPlanResponse(response: any, testCase: any): boolean {
    return !!(
      response.diagnosis &&
      response.specialty &&
      response.protocol &&
      response.protocol.medications &&
      response.protocol.diagnosticTests &&
      response.doctorApprovalRequired === true
    );
  }

  private validateNoteFeatureResponse(response: any, feature: string): boolean {
    switch (feature) {
      case 'Contextual Autocomplete':
      case 'Smart Suggestions':
        return Array.isArray(response) && response.length > 0;
      case 'Note Summarization':
        return !!(
          response.chiefComplaint &&
          response.historyOfPresentIllness &&
          response.physicalExamination &&
          response.assessment
        );
      default:
        return false;
    }
  }

  // Run All Tests
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting AIPC Comprehensive Test Suite...\n');
    
    this.results = [];
    
    await this.testSpecialtyAwareDiagnosis();
    await this.testDrugInteractions();
    await this.testAutomatedTreatmentPlans();
    await this.testEnhancedNoteFeatures();
    
    return this.results;
  }

  // Generate Test Report
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    let report = `
🧪 AIPC COMPREHENSIVE TEST REPORT
=====================================

📊 SUMMARY:
- Total Tests: ${totalTests}
- Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)
- Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)
- Average Response Time: ${averageResponseTime.toFixed(0)}ms

📋 DETAILED RESULTS:
`;

    this.results.forEach((result, index) => {
      report += `
${index + 1}. ${result.testName}
   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
   Response Time: ${result.responseTime}ms
   Details: ${result.details}
`;
    });

    return report;
  }
}

export default AIPCTestSuite;
