import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import * as aiService from '../services/geminiService';
import { 
    InitialAssessmentRequest, 
    ProvisionalDiagnosisRequest, 
    PatientProfile, 
    GenerateDoctorNotesRequest, 
    GeneratePrescriptionRequest, 
    GeneratedQuestion, 
    ProvisionalDiagnosisResult, 
    Prescription,
    ChatMessage,
    SuggestTestsRequest, 
    RefineDiagnosisRequest 
} from '../types';

// --- Database Service Placeholder ---
// In a real app, you'd have a database service to fetch/save patient profiles, episodes, etc.
// For example:
// import * as dbService from '../services/databaseService';

const getPatientProfileForRequest = async (profileData?: PatientProfile): Promise<PatientProfile | undefined> => {
    if (!profileData) return undefined;
    // If profileData contains an ID, you might fetch the full profile from DB
    // if (profileData.id) {
    //   return await dbService.getPatientById(profileData.id);
    // }
    // For now, just use the provided profile data directly
    return profileData;
}

export const handleInitialAssessment = async (
  req: Request<ParamsDictionary, GeneratedQuestion | { error: string }, InitialAssessmentRequest, Query>,
  res: Response<GeneratedQuestion | { error: string }>
): Promise<void> => {
  try {
    const { symptoms, chatHistory = [], patientProfile: patientProfileInput } = req.body;

    if (!symptoms) {
      res.status(400).json({ error: "Symptom text is required." });
      return;
    }

    const patientProfile = await getPatientProfileForRequest(patientProfileInput);

    const result = await aiService.getInitialAssessmentAndQuestion(symptoms, chatHistory as ChatMessage[], patientProfile);

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to get initial assessment from AI service." });
    }
  } catch (error) {
    console.error("Error in handleInitialAssessment:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

export const handleProvisionalDiagnosis = async (
  req: Request<ParamsDictionary, ProvisionalDiagnosisResult | { error: string }, ProvisionalDiagnosisRequest, Query>,
  res: Response<ProvisionalDiagnosisResult | { error: string }>
): Promise<void> => {
  try {
    const { chatHistory, patientProfile: patientProfileInput } = req.body;

    if (!chatHistory || chatHistory.length === 0) {
      res.status(400).json({ error: "Chat history is required." });
      return;
    }

    const patientProfile = await getPatientProfileForRequest(patientProfileInput);

    const result = await aiService.getProvisionalDiagnosis(chatHistory as ChatMessage[], patientProfile);

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to get provisional diagnosis from AI service." });
    }
  } catch (error) {
    console.error("Error in handleProvisionalDiagnosis:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

export const handleGenerateDoctorNotes = async (
  req: Request<ParamsDictionary, string | { error: string }, GenerateDoctorNotesRequest, Query>,
  res: Response<string | { error: string }>
): Promise<void> => {
  try {
    const { symptoms, provisionalDiagnosis, patientProfile: patientProfileInput, testResultsSummary } = req.body;

    if (!symptoms || !provisionalDiagnosis) {
      res.status(400).json({ error: "Symptoms and provisional diagnosis are required." });
      return;
    }

    const patientProfile = await getPatientProfileForRequest(patientProfileInput);

    const notes = await aiService.generateDoctorNotes(symptoms, provisionalDiagnosis, patientProfile, testResultsSummary);
    if (notes !== null) {
      res.status(200).send(notes); // Send as plain text
    } else {
      res.status(500).json({ error: "Failed to generate doctor notes." });
    }
  } catch (error) {
    console.error("Error in handleGenerateDoctorNotes:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

export const handleGeneratePrescriptionWithEducation = async (
  req: Request<ParamsDictionary, Prescription | { error: string }, GeneratePrescriptionRequest, Query>,
  res: Response<Prescription | { error: string }>
): Promise<void> => {
    try {
        const {
            provisionalDiagnosis,
            doctorSummaryForPrescription,
            doctorName,
            clinicAddress,
            clinicLicense,
        } = req.body;

        if (!provisionalDiagnosis || !doctorSummaryForPrescription) {
            res.status(400).json({ error: "Provisional diagnosis and doctor's summary are required." });
            return;
        }

        const prescription = await aiService.generatePrescriptionWithEducation(
            provisionalDiagnosis,
            doctorSummaryForPrescription,
            doctorName,
            clinicAddress,
            clinicLicense
        );

        if (prescription) {
            res.status(200).json(prescription);
        } else {
            res.status(500).json({ error: "Failed to generate prescription." });
        }
    } catch (error) {
        console.error("Error in handleGeneratePrescriptionWithEducation:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

// New Handlers
export const handleSuggestTests = async (
  req: Request<ParamsDictionary, string[] | { error: string }, SuggestTestsRequest, Query>,
  res: Response<string[] | { error: string }>
): Promise<void> => {
    try {
        const { provisionalCondition } = req.body;
        if (!provisionalCondition) {
            res.status(400).json({ error: "Provisional condition is required." });
            return;
        }
        const tests = await aiService.suggestTestsBasedOnCondition(provisionalCondition);
        if (tests) {
            res.status(200).json(tests);
        } else {
            res.status(500).json({ error: "Failed to suggest tests." });
        }
    } catch (error) {
        console.error("Error in handleSuggestTests:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

export const handleRefineDiagnosis = async (
  req: Request<ParamsDictionary, ProvisionalDiagnosisResult | { error: string }, RefineDiagnosisRequest, Query>,
  res: Response<ProvisionalDiagnosisResult | { error: string }>
): Promise<void> => {
    try {
        const { provisionalDiagnosis, testResultsSummary, patientProfile: patientProfileInput } = req.body;
        if (!provisionalDiagnosis || !testResultsSummary) {
            res.status(400).json({ error: "Provisional diagnosis and test results summary are required." });
            return;
        }
        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const refinedDiagnosis = await aiService.refineDiagnosisWithTestResults(provisionalDiagnosis, testResultsSummary, patientProfile);
        if (refinedDiagnosis) {
            res.status(200).json(refinedDiagnosis);
        } else {
            res.status(500).json({ error: "Failed to refine diagnosis." });
        }
    } catch (error) {
        console.error("Error in handleRefineDiagnosis:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};
