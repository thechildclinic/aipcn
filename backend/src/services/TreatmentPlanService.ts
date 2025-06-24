import { patientService } from './index';

export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  frequency?: string;
  triggers?: string[];
  associatedSymptoms?: string[];
}

export interface MedicalHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
  surgeries?: string[];
  familyHistory?: string[];
}

export interface TreatmentRecommendation {
  type: 'medication' | 'test' | 'lifestyle' | 'referral' | 'follow_up';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  instructions?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  precautions?: string[];
  contraindications?: string[];
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  symptoms: Symptom[];
  assessment: {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    riskFactors: string[];
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high' | 'emergency';
  };
  recommendations: TreatmentRecommendation[];
  redFlags: string[];
  followUpInstructions: string[];
  emergencyWarnings: string[];
  generatedAt: Date;
  confidence: number; // 0-100
}

export class TreatmentPlanService {
  /**
   * Generate comprehensive treatment plan based on symptoms and patient history
   */
  async generateTreatmentPlan(
    patientId: string,
    symptoms: Symptom[],
    additionalInfo?: {
      chiefComplaint?: string;
      onsetDate?: Date;
      triggeringEvents?: string[];
      previousTreatments?: string[];
    }
  ): Promise<TreatmentPlan> {
    // Get patient information
    const patient = await patientService.findByIdWithUser(patientId);
    
    const medicalHistory: MedicalHistory = {
      conditions: [], // Would be extracted from patient.medicalHistory
      medications: patient.currentMedications || [],
      allergies: patient.allergies || [],
    };

    // Analyze symptoms and generate assessment
    const assessment = this.analyzeSymptoms(symptoms, medicalHistory);
    
    // Generate recommendations based on assessment
    const recommendations = this.generateRecommendations(assessment, symptoms, medicalHistory);
    
    // Identify red flags and emergency warnings
    const redFlags = this.identifyRedFlags(symptoms, assessment);
    const emergencyWarnings = this.generateEmergencyWarnings(assessment, redFlags);
    
    // Generate follow-up instructions
    const followUpInstructions = this.generateFollowUpInstructions(assessment, recommendations);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(symptoms, assessment, medicalHistory);

    const treatmentPlan: TreatmentPlan = {
      id: `plan_${Date.now()}_${patientId}`,
      patientId,
      symptoms,
      assessment,
      recommendations,
      redFlags,
      followUpInstructions,
      emergencyWarnings,
      generatedAt: new Date(),
      confidence,
    };

    return treatmentPlan;
  }

  /**
   * Analyze symptoms to determine primary and differential diagnoses
   */
  private analyzeSymptoms(symptoms: Symptom[], medicalHistory: MedicalHistory): TreatmentPlan['assessment'] {
    // This is a simplified symptom analysis
    // In a real implementation, this would use medical knowledge bases and AI
    
    const symptomNames = symptoms.map(s => s.name.toLowerCase());
    const severities = symptoms.map(s => s.severity);
    
    let primaryDiagnosis = 'Symptom assessment required';
    let differentialDiagnoses: string[] = [];
    let riskFactors: string[] = [];
    let severity: 'mild' | 'moderate' | 'severe' = 'mild';
    let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';

    // Respiratory symptoms
    if (symptomNames.some(s => ['cough', 'shortness of breath', 'chest pain'].includes(s))) {
      primaryDiagnosis = 'Upper respiratory tract infection';
      differentialDiagnoses = ['Bronchitis', 'Pneumonia', 'Asthma exacerbation'];
      
      if (symptomNames.includes('shortness of breath') || symptomNames.includes('chest pain')) {
        urgency = 'high';
        severity = 'moderate';
      }
    }
    
    // Gastrointestinal symptoms
    else if (symptomNames.some(s => ['nausea', 'vomiting', 'diarrhea', 'abdominal pain'].includes(s))) {
      primaryDiagnosis = 'Gastroenteritis';
      differentialDiagnoses = ['Food poisoning', 'Viral gastroenteritis', 'Inflammatory bowel disease'];
      
      if (symptoms.some(s => s.severity === 'severe')) {
        urgency = 'medium';
        severity = 'moderate';
      }
    }
    
    // Neurological symptoms
    else if (symptomNames.some(s => ['headache', 'dizziness', 'confusion'].includes(s))) {
      primaryDiagnosis = 'Tension headache';
      differentialDiagnoses = ['Migraine', 'Cluster headache', 'Secondary headache'];
      
      if (symptomNames.includes('confusion') || severities.includes('severe')) {
        urgency = 'high';
        severity = 'moderate';
      }
    }
    
    // Musculoskeletal symptoms
    else if (symptomNames.some(s => ['joint pain', 'muscle pain', 'back pain'].includes(s))) {
      primaryDiagnosis = 'Musculoskeletal strain';
      differentialDiagnoses = ['Arthritis', 'Fibromyalgia', 'Injury'];
    }

    // Adjust based on medical history
    if (medicalHistory.conditions.length > 0) {
      riskFactors.push('Pre-existing medical conditions');
    }
    
    if (medicalHistory.medications.length > 0) {
      riskFactors.push('Current medications may interact');
    }

    // Determine overall severity
    if (severities.includes('severe')) {
      severity = 'severe';
      urgency = urgency === 'low' ? 'medium' : urgency;
    } else if (severities.includes('moderate')) {
      severity = 'moderate';
    }

    return {
      primaryDiagnosis,
      differentialDiagnoses,
      riskFactors,
      severity,
      urgency,
    };
  }

  /**
   * Generate treatment recommendations based on assessment
   */
  private generateRecommendations(
    assessment: TreatmentPlan['assessment'],
    symptoms: Symptom[],
    medicalHistory: MedicalHistory
  ): TreatmentRecommendation[] {
    const recommendations: TreatmentRecommendation[] = [];

    // Based on primary diagnosis
    switch (assessment.primaryDiagnosis) {
      case 'Upper respiratory tract infection':
        recommendations.push({
          type: 'medication',
          title: 'Symptomatic relief',
          description: 'Over-the-counter medications for symptom management',
          urgency: 'medium',
          instructions: 'Take acetaminophen or ibuprofen for pain and fever',
          dosage: '500mg acetaminophen or 200mg ibuprofen',
          frequency: 'Every 6-8 hours as needed',
          duration: '3-5 days',
          precautions: ['Do not exceed maximum daily dose', 'Take with food if stomach upset occurs'],
        });
        
        recommendations.push({
          type: 'lifestyle',
          title: 'Rest and hydration',
          description: 'Supportive care measures',
          urgency: 'medium',
          instructions: 'Get plenty of rest, drink fluids, use humidifier',
        });
        break;

      case 'Gastroenteritis':
        recommendations.push({
          type: 'lifestyle',
          title: 'Dietary modifications',
          description: 'BRAT diet and hydration',
          urgency: 'high',
          instructions: 'Follow BRAT diet (bananas, rice, applesauce, toast), increase fluid intake',
        });
        
        if (assessment.severity === 'severe') {
          recommendations.push({
            type: 'test',
            title: 'Laboratory evaluation',
            description: 'Stool culture and electrolyte panel',
            urgency: 'high',
            instructions: 'Collect stool sample for culture, blood work for electrolytes',
          });
        }
        break;

      case 'Tension headache':
        recommendations.push({
          type: 'medication',
          title: 'Pain relief',
          description: 'Analgesic medication',
          urgency: 'medium',
          instructions: 'Take over-the-counter pain reliever',
          dosage: '500mg acetaminophen or 400mg ibuprofen',
          frequency: 'Every 6 hours as needed',
          duration: '1-2 days',
        });
        
        recommendations.push({
          type: 'lifestyle',
          title: 'Stress management',
          description: 'Relaxation techniques and lifestyle modifications',
          urgency: 'low',
          instructions: 'Practice relaxation techniques, ensure adequate sleep, manage stress',
        });
        break;
    }

    // Add follow-up recommendation
    if (assessment.urgency === 'high' || assessment.severity === 'severe') {
      recommendations.push({
        type: 'follow_up',
        title: 'Medical follow-up',
        description: 'Schedule follow-up appointment',
        urgency: 'high',
        instructions: 'Schedule appointment with primary care physician within 24-48 hours',
      });
    } else {
      recommendations.push({
        type: 'follow_up',
        title: 'Follow-up if needed',
        description: 'Monitor symptoms and seek care if worsening',
        urgency: 'low',
        instructions: 'Follow up with healthcare provider if symptoms worsen or persist beyond 7 days',
      });
    }

    // Check for drug allergies and contraindications
    recommendations.forEach(rec => {
      if (rec.type === 'medication') {
        const contraindications = this.checkContraindications(rec, medicalHistory);
        if (contraindications.length > 0) {
          rec.contraindications = contraindications;
        }
      }
    });

    return recommendations;
  }

  /**
   * Identify red flag symptoms requiring immediate attention
   */
  private identifyRedFlags(symptoms: Symptom[], assessment: TreatmentPlan['assessment']): string[] {
    const redFlags: string[] = [];
    const symptomNames = symptoms.map(s => s.name.toLowerCase());

    // Respiratory red flags
    if (symptomNames.includes('shortness of breath') && symptoms.find(s => s.name.toLowerCase() === 'shortness of breath')?.severity === 'severe') {
      redFlags.push('Severe shortness of breath - seek immediate medical attention');
    }

    // Neurological red flags
    if (symptomNames.includes('confusion') || symptomNames.includes('altered mental status')) {
      redFlags.push('Altered mental status - requires immediate evaluation');
    }

    // Cardiovascular red flags
    if (symptomNames.includes('chest pain') && symptoms.find(s => s.name.toLowerCase() === 'chest pain')?.severity === 'severe') {
      redFlags.push('Severe chest pain - rule out cardiac emergency');
    }

    // Gastrointestinal red flags
    if (symptomNames.includes('severe abdominal pain') || 
        (symptomNames.includes('vomiting') && symptoms.find(s => s.name.toLowerCase() === 'vomiting')?.severity === 'severe')) {
      redFlags.push('Severe abdominal symptoms - consider surgical emergency');
    }

    return redFlags;
  }

  /**
   * Generate emergency warnings
   */
  private generateEmergencyWarnings(assessment: TreatmentPlan['assessment'], redFlags: string[]): string[] {
    const warnings: string[] = [];

    if (assessment.urgency === 'emergency' || redFlags.length > 0) {
      warnings.push('Seek immediate medical attention if symptoms worsen');
      warnings.push('Call 911 if experiencing severe difficulty breathing, chest pain, or altered consciousness');
    }

    if (assessment.severity === 'severe') {
      warnings.push('Monitor symptoms closely and seek medical care if no improvement in 24 hours');
    }

    warnings.push('This assessment is not a substitute for professional medical evaluation');

    return warnings;
  }

  /**
   * Generate follow-up instructions
   */
  private generateFollowUpInstructions(
    assessment: TreatmentPlan['assessment'],
    recommendations: TreatmentRecommendation[]
  ): string[] {
    const instructions: string[] = [];

    if (assessment.urgency === 'high') {
      instructions.push('Schedule follow-up appointment within 24-48 hours');
    } else if (assessment.urgency === 'medium') {
      instructions.push('Schedule follow-up appointment within 3-5 days if symptoms persist');
    } else {
      instructions.push('Follow up with healthcare provider if symptoms worsen or persist beyond 7 days');
    }

    instructions.push('Keep a symptom diary to track changes');
    instructions.push('Take medications as directed and note any side effects');

    return instructions;
  }

  /**
   * Check for medication contraindications
   */
  private checkContraindications(recommendation: TreatmentRecommendation, medicalHistory: MedicalHistory): string[] {
    const contraindications: string[] = [];

    if (recommendation.type === 'medication') {
      // Check allergies
      if (medicalHistory.allergies.some(allergy => 
        recommendation.description?.toLowerCase().includes(allergy.toLowerCase()) ||
        recommendation.instructions?.toLowerCase().includes(allergy.toLowerCase())
      )) {
        contraindications.push('Patient has documented allergy to this medication class');
      }

      // Check drug interactions (simplified)
      if (medicalHistory.medications.length > 0) {
        contraindications.push('Review current medications for potential interactions');
      }
    }

    return contraindications;
  }

  /**
   * Calculate confidence score for the treatment plan
   */
  private calculateConfidence(
    symptoms: Symptom[],
    assessment: TreatmentPlan['assessment'],
    medicalHistory: MedicalHistory
  ): number {
    let confidence = 70; // Base confidence

    // Adjust based on symptom clarity
    if (symptoms.length >= 3) {
      confidence += 10; // More symptoms provide better picture
    }

    // Adjust based on severity consistency
    const severities = symptoms.map(s => s.severity);
    if (severities.every(s => s === severities[0])) {
      confidence += 5; // Consistent severity
    }

    // Adjust based on medical history availability
    if (medicalHistory.conditions.length > 0 || medicalHistory.medications.length > 0) {
      confidence += 10; // Medical history helps
    }

    // Adjust based on assessment complexity
    if (assessment.differentialDiagnoses.length > 2) {
      confidence -= 5; // More differentials = less certainty
    }

    return Math.min(95, Math.max(30, confidence)); // Cap between 30-95%
  }
}
