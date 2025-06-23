import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import * as aiService from '../services/geminiService';
import {
    PatientProfile,
    DoctorNoteSuggestionsRequest,
    DoctorNoteSuggestion,
    DifferentialDiagnosesRequest,
    DDxItem,
    DDxActionsRequest,
    DDxActionSuggestion
} from '../types';

// Enhanced AI Assistant Types
interface AutocompleteRequest {
    currentText: string;
    currentWord: string;
    provisionalDiagnosis: string;
    patientProfile?: PatientProfile;
}

interface SmartSuggestionsRequest {
    currentText: string;
    provisionalDiagnosis: string;
    patientProfile?: PatientProfile;
    selectedDDx?: string;
}

interface SummarizeNotesRequest {
    rawNotes: string;
    provisionalDiagnosis: string;
    patientProfile?: PatientProfile;
}

interface StructuredNotes {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    physicalExamination: string;
    assessment: string;
}

const getPatientProfileForRequest = async (profileData?: PatientProfile): Promise<PatientProfile | undefined> => {
    if (!profileData) return undefined;
    return profileData;
};

export const handleGenerateDoctorNoteSuggestions = async (
  req: Request<ParamsDictionary, DoctorNoteSuggestion[] | { error: string }, DoctorNoteSuggestionsRequest, Query>,
  res: Response<DoctorNoteSuggestion[] | { error: string }>
): Promise<void> => {
    try {
        const { currentNote, provisionalDiagnosis, patientProfile: patientProfileInput } = req.body;
        if (!currentNote || !provisionalDiagnosis) {
            res.status(400).json({ error: "Current note and provisional diagnosis are required." });
            return;
        }
        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const suggestions = await aiService.generateDoctorNoteSuggestions(currentNote, provisionalDiagnosis, patientProfile);
        if (suggestions) {
            res.status(200).json(suggestions);
        } else {
            // Return empty array as per frontend service fallback
            res.status(200).json([]);
        }
    } catch (error) {
        console.error("Error in handleGenerateDoctorNoteSuggestions:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

export const handleGenerateDifferentialDiagnoses = async (
  req: Request<ParamsDictionary, DDxItem[] | { error: string }, DifferentialDiagnosesRequest, Query>,
  res: Response<DDxItem[] | { error: string }>
): Promise<void> => {
    try {
        const { patientSymptoms, provisionalDiagnosis, doctorInitialNotes, patientProfile: patientProfileInput } = req.body;
        if (!patientSymptoms || !provisionalDiagnosis || !doctorInitialNotes) {
            res.status(400).json({ error: "Patient symptoms, provisional diagnosis, and doctor's initial notes are required." });
            return;
        }
        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const ddxItems = await aiService.generateDifferentialDiagnoses(patientSymptoms, provisionalDiagnosis, doctorInitialNotes, patientProfile);
        if (ddxItems) {
            res.status(200).json(ddxItems);
        } else {
            res.status(500).json({ error: "Failed to generate differential diagnoses." }); // Consistent error message
        }
    } catch (error) {
        console.error("Error in handleGenerateDifferentialDiagnoses:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

export const handleSuggestActionsForDDx = async (
  req: Request<ParamsDictionary, DDxActionSuggestion | { error: string }, DDxActionsRequest, Query>,
  res: Response<DDxActionSuggestion | { error: string }>
): Promise<void> => {
    try {
        const { selectedDDx, patientProfile: patientProfileInput } = req.body;
        if (!selectedDDx) {
            res.status(400).json({ error: "Selected DDx condition is required." });
            return;
        }
        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const ddxActions = await aiService.suggestActionsForDDx(selectedDDx, patientProfile);
        if (ddxActions) {
            res.status(200).json(ddxActions);
        } else {
             // Return empty object as per frontend service fallback
            res.status(200).json({ suggestedMedications: [], suggestedTests: [] });
        }
    } catch (error) {
        console.error("Error in handleSuggestActionsForDDx:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

// Enhanced AI Assistant Endpoints

export const handleContextualAutocomplete = async (
  req: Request<ParamsDictionary, string[] | { error: string }, AutocompleteRequest, Query>,
  res: Response<string[] | { error: string }>
): Promise<void> => {
    try {
        const { currentText, currentWord, provisionalDiagnosis, patientProfile: patientProfileInput } = req.body;

        if (!currentText || !currentWord) {
            res.status(400).json({ error: "Current text and current word are required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const suggestions = await aiService.generateContextualAutocomplete(
            currentText,
            currentWord,
            provisionalDiagnosis,
            patientProfile
        );

        res.status(200).json(suggestions || []);
    } catch (error) {
        console.error("Error in handleContextualAutocomplete:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

export const handleSmartSuggestions = async (
  req: Request<ParamsDictionary, string[] | { error: string }, SmartSuggestionsRequest, Query>,
  res: Response<string[] | { error: string }>
): Promise<void> => {
    try {
        const { currentText, provisionalDiagnosis, patientProfile: patientProfileInput, selectedDDx } = req.body;

        if (!currentText) {
            res.status(400).json({ error: "Current text is required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const suggestions = await aiService.generateSmartSuggestions(
            currentText,
            provisionalDiagnosis,
            patientProfile,
            selectedDDx
        );

        res.status(200).json(suggestions || []);
    } catch (error) {
        console.error("Error in handleSmartSuggestions:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

export const handleSummarizeNotes = async (
  req: Request<ParamsDictionary, StructuredNotes | { error: string }, SummarizeNotesRequest, Query>,
  res: Response<StructuredNotes | { error: string }>
): Promise<void> => {
    try {
        const { rawNotes, provisionalDiagnosis, patientProfile: patientProfileInput } = req.body;

        if (!rawNotes) {
            res.status(400).json({ error: "Raw notes are required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const structuredNotes = await aiService.summarizeNotesToStructured(
            rawNotes,
            provisionalDiagnosis,
            patientProfile
        );

        if (structuredNotes) {
            res.status(200).json(structuredNotes);
        } else {
            res.status(500).json({ error: "Failed to summarize notes." });
        }
    } catch (error) {
        console.error("Error in handleSummarizeNotes:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

// Phase 4: Specialty-Aware Diagnosis Controller

export const handleSpecialtyAwareProvisionalDiagnosis = async (
  req: Request<ParamsDictionary, any, { symptoms: string; chatHistory: any[]; patientProfile?: PatientProfile; clinicSpecialty?: string }, Query>,
  res: Response<any>
): Promise<void> => {
    try {
        const { symptoms, chatHistory, patientProfile: patientProfileInput, clinicSpecialty } = req.body;

        if (!symptoms) {
            res.status(400).json({ error: "Symptoms are required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const result = await aiService.generateSpecialtyAwareProvisionalDiagnosis(
            symptoms,
            chatHistory || [],
            patientProfile,
            clinicSpecialty
        );

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: "Failed to generate specialty-aware provisional diagnosis." });
        }
    } catch (error) {
        console.error("Error in handleSpecialtyAwareProvisionalDiagnosis:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

// Phase 5: Drug Interaction Checking Controller

export const handleDrugInteractionCheck = async (
  req: Request<ParamsDictionary, any, { medications: string[]; patientProfile?: PatientProfile; currentMedications?: string[] }, Query>,
  res: Response<any>
): Promise<void> => {
    try {
        const { medications, patientProfile: patientProfileInput, currentMedications } = req.body;

        if (!medications || medications.length === 0) {
            res.status(400).json({ error: "Medications list is required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const result = await aiService.checkDrugInteractions(
            medications,
            patientProfile,
            currentMedications
        );

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: "Failed to check drug interactions." });
        }
    } catch (error) {
        console.error("Error in handleDrugInteractionCheck:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};

// Phase 6: Automated Treatment Plan Controller

export const handleGenerateAutomatedTreatmentPlan = async (
  req: Request<ParamsDictionary, any, { confirmedDiagnosis: string; clinicSpecialty: string; patientProfile?: PatientProfile; clinicalNotes?: string }, Query>,
  res: Response<any>
): Promise<void> => {
    try {
        const { confirmedDiagnosis, clinicSpecialty, patientProfile: patientProfileInput, clinicalNotes } = req.body;

        if (!confirmedDiagnosis || !clinicSpecialty) {
            res.status(400).json({ error: "Confirmed diagnosis and clinic specialty are required." });
            return;
        }

        const patientProfile = await getPatientProfileForRequest(patientProfileInput);
        const result = await aiService.generateAutomatedTreatmentPlan(
            confirmedDiagnosis,
            clinicSpecialty,
            patientProfile,
            clinicalNotes
        );

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ error: "Failed to generate automated treatment plan." });
        }
    } catch (error) {
        console.error("Error in handleGenerateAutomatedTreatmentPlan:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
};
